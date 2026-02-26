import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }

    const { data: doc, error: docError } = await supabaseServer
      .from('documents')
      .select('id, filename, doc_type, score, created_at, extracted_text')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const { data: rewrites } = await supabaseServer
      .from('rewrites')
      .select('id, original_text, fixed_text, analysis_result, created_at')
      .eq('document_id', id)
      .order('created_at', { ascending: false })
      .limit(1);

    const latest = rewrites?.[0];
    const docRow = doc as {
      id: string;
      filename: string;
      doc_type: string;
      score: number | null;
      created_at: string;
      extracted_text?: string | null;
    };
    const rewriteRow = latest as {
      id: string;
      original_text?: string;
      fixed_text?: string;
      analysis_result?: {
        summary?: string;
        issues?: { section: string; problem: string; severity: string }[];
        rewrites?: { original: string; improved: string }[];
        missing_sections?: string[];
        ats_score?: number;
        jd_match?: number;
        keyword_gap?: string[];
      } | null;
      created_at: string;
    } | undefined;

    const ar = rewriteRow?.analysis_result as {
      ats_score?: number;
      jd_match?: number;
      keyword_gap?: string[];
      keyword_matched?: string[];
      cv_checklist?: { item: string; passed: boolean; tip?: string }[];
      stronger_verbs?: { original: string; suggested: string }[];
    } | undefined;
    const analysis = rewriteRow?.analysis_result
      ? {
          score: docRow.score ?? 0,
          summary: rewriteRow.analysis_result.summary ?? '',
          issues: rewriteRow.analysis_result.issues ?? [],
          rewrites: rewriteRow.analysis_result.rewrites ?? [],
          missing_sections: rewriteRow.analysis_result.missing_sections ?? [],
          fixedText: rewriteRow.fixed_text,
          originalText: rewriteRow.original_text,
          ...(rewriteRow.analysis_result.ats_score != null && { ats_score: rewriteRow.analysis_result.ats_score }),
          ...(rewriteRow.analysis_result.jd_match != null && { jd_match: rewriteRow.analysis_result.jd_match }),
          ...(rewriteRow.analysis_result.keyword_gap != null && { keyword_gap: rewriteRow.analysis_result.keyword_gap }),
          ...(ar?.keyword_matched != null && { keyword_matched: ar.keyword_matched }),
          ...(ar?.cv_checklist != null && { cv_checklist: ar.cv_checklist }),
          ...(ar?.stronger_verbs != null && { stronger_verbs: ar.stronger_verbs }),
        }
      : null;

    return NextResponse.json({
      document: {
        id: docRow.id,
        filename: docRow.filename,
        docType: docRow.doc_type,
        score: docRow.score,
        date: new Date(docRow.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        extractedText: docRow.extracted_text ?? undefined,
      },
      rewrite: rewriteRow
        ? {
            id: rewriteRow.id,
            fixedText: rewriteRow.fixed_text,
            originalText: rewriteRow.original_text,
          }
        : null,
      analysis,
    });
  } catch (err) {
    console.error('Document get error:', err);
    return NextResponse.json({ error: 'Failed to load document' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
    }

    const { data: doc, error: fetchError } = await supabaseServer
      .from('documents')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await supabaseServer.from('rewrites').delete().eq('document_id', id);
    const { error: deleteError } = await supabaseServer.from('documents').delete().eq('id', id).eq('user_id', userId);

    if (deleteError) {
      console.error('Document delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Document delete error:', err);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
