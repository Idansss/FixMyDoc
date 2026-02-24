import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { getSystemPrompt, type DocType } from '@/lib/analysis/system-prompt';
import { ratelimit } from '@/lib/ratelimit';
import { sendEmail } from '@/lib/email';

const MODEL = 'claude-sonnet-4-20250514';

export interface AnalyzeBody {
  documentId: string;
  extractedText: string;
  docType: DocType;
  /** Optional job description for CV/resume ATS mode. When set, response includes ats_score, jd_match, keyword_gap, keyword_matched. */
  jobDescription?: string | null;
  /** Optional industry or target role (e.g. "Software Engineer", "Healthcare") to tailor CV suggestions. */
  industryOrRole?: string | null;
}

export interface AnalysisResult {
  score: number;
  summary: string;
  issues: { section: string; problem: string; severity: string }[];
  rewrites: { original: string; improved: string }[];
  missing_sections: string[];
  ats_score?: number;
  jd_match?: number;
  keyword_gap?: string[];
  keyword_matched?: string[];
  cv_checklist?: { item: string; passed: boolean; tip?: string }[];
  stronger_verbs?: { original: string; suggested: string }[];
}

function isToday(isoDate: string | null): boolean {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (ratelimit) {
      const rateLimitResult = await ratelimit.limit(userId);
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Too many requests. Try again later.' },
          { status: 429 }
        );
      }
    }

    const body = (await req.json()) as AnalyzeBody;
    let { documentId, extractedText, docType, jobDescription, industryOrRole } = body;
    if (!documentId || !docType) {
      return NextResponse.json(
        { error: 'Missing documentId or docType' },
        { status: 400 }
      );
    }
    if (extractedText == null || extractedText === '') {
      const { data: docRow } = await supabaseServer
        .from('documents')
        .select('extracted_text')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();
      extractedText = (docRow as { extracted_text?: string } | null)?.extracted_text ?? '';
    }
    if (!extractedText) {
      return NextResponse.json(
        { error: 'No text to analyze. Re-upload the document or provide extractedText.' },
        { status: 400 }
      );
    }
    if (!['cv', 'legal', 'academic', 'business'].includes(docType)) {
      return NextResponse.json({ error: 'Invalid docType' }, { status: 400 });
    }

    const { data: userRow } = await supabaseServer
      .from('users')
      .select('plan, usage_count, usage_reset_at')
      .eq('id', userId)
      .single();

    const row = userRow as { plan: string; usage_count: number; usage_reset_at: string | null } | null;
    const plan = row?.plan ?? 'free';
    let usageCount = row?.usage_count ?? 0;
    const usageResetAt = row?.usage_reset_at ?? null;

    if (plan === 'free') {
      if (!isToday(usageResetAt)) {
        await supabaseServer.from('users').update({
          usage_count: 0,
          usage_reset_at: new Date().toISOString(),
        }).eq('id', userId);
        usageCount = 0;
      }
      if (usageCount >= 1) {
        try {
          const { data: emailRow } = await supabaseServer.from('users').select('email').eq('id', userId).single();
          if (emailRow?.email) {
            await sendEmail(emailRow.email, 'usage_limit', { upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard` });
          }
        } catch (_) {}
        return NextResponse.json(
          { error: 'Daily limit reached. Upgrade to analyze more documents.' },
          { status: 403 }
        );
      }
    }

    const { data: doc } = await supabaseServer
      .from('documents')
      .select('id, user_id')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const anthropic = new Anthropic();
    const systemPrompt = getSystemPrompt(docType, jobDescription, industryOrRole);
    const docPayload =
      docType === 'cv' && jobDescription && jobDescription.trim()
        ? `Job description (use for ATS/jd_match/keyword_gap):\n${jobDescription.slice(0, 15000)}\n\nResume/Document:\n${extractedText.slice(0, 85000)}`
        : `Document:\n${extractedText.slice(0, 100000)}`;
    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze this document and return only the JSON object.\n\n${docPayload}`,
        },
      ],
    });

    let fullText = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullText += event.delta.text;
      }
    }

    const trimmed = fullText.trim().replace(/^```json\s*|\s*```$/g, '');
    let parsed: AnalysisResult;
    try {
      parsed = JSON.parse(trimmed) as AnalysisResult;
    } catch {
      return NextResponse.json(
        { error: 'AI returned invalid JSON' },
        { status: 500 }
      );
    }

    const score = typeof parsed.score === 'number' ? parsed.score : 0;
    const fixedText = parsed.rewrites?.length
      ? parsed.rewrites.map((r) => r.improved).join('\n\n')
      : extractedText;

    await supabaseServer.from('documents').update({ score }).eq('id', documentId);

    const analysisResult = {
      summary: parsed.summary ?? '',
      issues: parsed.issues ?? [],
      rewrites: parsed.rewrites ?? [],
      missing_sections: parsed.missing_sections ?? [],
      ...(parsed.ats_score != null && { ats_score: parsed.ats_score }),
      ...(parsed.jd_match != null && { jd_match: parsed.jd_match }),
      ...(parsed.keyword_gap != null && { keyword_gap: parsed.keyword_gap }),
      ...(parsed.keyword_matched != null && { keyword_matched: parsed.keyword_matched }),
      ...(parsed.cv_checklist != null && { cv_checklist: parsed.cv_checklist }),
      ...(parsed.stronger_verbs != null && { stronger_verbs: parsed.stronger_verbs }),
    };
    const { data: rewriteRow, error: rewriteError } = await supabaseServer
      .from('rewrites')
      .insert({
        document_id: documentId,
        original_text: extractedText,
        fixed_text: fixedText,
        analysis_result: analysisResult,
      })
      .select('id')
      .single();

    if (rewriteError) {
      console.error('Rewrites insert error:', rewriteError);
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      );
    }

    try {
      const { data: emailRow } = await supabaseServer.from('users').select('email').eq('id', userId).single();
      const { data: docRow } = await supabaseServer.from('documents').select('filename').eq('id', documentId).single();
      if (emailRow?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        await sendEmail(emailRow.email, 'analysis_done', {
          documentName: (docRow as { filename?: string } | null)?.filename ?? 'Document',
          viewUrl: `${appUrl}/dashboard/documents/${documentId}`,
        });
      }
    } catch (_) {}

    const newResetAt = plan === 'free' && !isToday(usageResetAt) ? new Date().toISOString() : usageResetAt;
    const newCount = plan === 'free' && !isToday(usageResetAt) ? 1 : usageCount + 1;

    await supabaseServer.from('users').update({
      usage_count: newCount,
      usage_reset_at: plan === 'free' ? new Date().toISOString() : newResetAt,
    }).eq('id', userId);

    return NextResponse.json({
      rewriteId: rewriteRow?.id,
      score: parsed.score,
      summary: parsed.summary,
      issues: parsed.issues ?? [],
      rewrites: parsed.rewrites ?? [],
      missing_sections: parsed.missing_sections ?? [],
      ...(parsed.ats_score != null && { ats_score: parsed.ats_score }),
      ...(parsed.jd_match != null && { jd_match: parsed.jd_match }),
      ...(parsed.keyword_gap != null && { keyword_gap: parsed.keyword_gap }),
      ...(parsed.keyword_matched != null && { keyword_matched: parsed.keyword_matched }),
      ...(parsed.cv_checklist != null && { cv_checklist: parsed.cv_checklist }),
      ...(parsed.stronger_verbs != null && { stronger_verbs: parsed.stronger_verbs }),
    });
  } catch (err) {
    console.error('Analyze error:', err);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
