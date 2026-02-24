import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-20250514';

export interface LinkedInOptimizerBody {
  targetRole: string;
  headline?: string;
  about?: string;
  experience?: string;
}

export interface LinkedInOptimizerResult {
  headline?: string;
  about?: string;
  experience?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as LinkedInOptimizerBody;
    const { targetRole, headline, about, experience } = body;

    if (!targetRole?.trim()) {
      return NextResponse.json({ error: 'Target role is required.' }, { status: 400 });
    }
    if (!headline?.trim() && !about?.trim() && !experience?.trim()) {
      return NextResponse.json(
        { error: 'Provide at least one section to optimize.' },
        { status: 400 }
      );
    }

    // Build the user message dynamically with only provided sections
    const sections: string[] = [];
    if (headline?.trim()) sections.push(`HEADLINE (max 220 chars):\n${headline.trim()}`);
    if (about?.trim()) sections.push(`ABOUT / SUMMARY (max 2600 chars):\n${about.trim().slice(0, 2600)}`);
    if (experience?.trim()) sections.push(`EXPERIENCE DESCRIPTION (max 2000 chars):\n${experience.trim().slice(0, 2000)}`);

    const anthropic = new Anthropic();
    const { content } = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2500,
      system: `You are an expert LinkedIn profile writer and personal brand coach. Rewrite the provided LinkedIn sections to be compelling, keyword-rich, and optimized for the target role.

Return ONLY valid JSON (no markdown, no code fences) with only the keys that were provided in the input:
{
  "headline": "...",   // only if headline was provided — max 220 chars
  "about": "...",      // only if about was provided — max 2600 chars
  "experience": "..."  // only if experience was provided — max 2000 chars
}

Rules:
- Write in first person for About; third person is optional but first person performs better
- Headline: punchy, role-specific, include 1–2 keywords, avoid buzzwords like "passionate" or "guru"
- About: hook in first sentence, highlight impact/achievements, include relevant keywords naturally, end with a call to action or what you're looking for
- Experience: start each bullet with a strong action verb, quantify results where possible, mirror keywords from the target role
- Stay within LinkedIn's character limits
- Do not add placeholder text like [Company] or [X%] — if no data is available, write around it
- Output only the JSON object, nothing else`,
      messages: [
        {
          role: 'user',
          content: `Target role: ${targetRole.trim().slice(0, 200)}\n\n${sections.join('\n\n---\n\n')}\n\nOptimize these sections for the target role and return the JSON.`,
        },
      ],
    });

    const textBlock = content.find((c) => c.type === 'text');
    const raw = textBlock && 'text' in textBlock ? (textBlock.text as string).trim() : '';

    if (!raw) {
      return NextResponse.json({ error: 'Could not generate optimized profile.' }, { status: 500 });
    }

    let result: LinkedInOptimizerResult;
    try {
      result = JSON.parse(raw) as LinkedInOptimizerResult;
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: 'Could not parse response.' }, { status: 500 });
      }
      result = JSON.parse(match[0]) as LinkedInOptimizerResult;
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('LinkedIn optimizer error:', err);
    return NextResponse.json({ error: 'Failed to optimize profile.' }, { status: 500 });
  }
}
