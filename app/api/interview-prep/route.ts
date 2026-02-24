import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-20250514';

export interface InterviewQuestion {
  category: string;
  question: string;
  guidance: string;
}

export interface InterviewPrepResult {
  questions: InterviewQuestion[];
  tips: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { resumeText, jobDescription } = body as {
      resumeText?: string;
      jobDescription?: string;
    };

    if (!resumeText?.trim() || !jobDescription?.trim()) {
      return NextResponse.json(
        { error: 'Both resume and job description are required.' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic();
    const { content } = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: `You are an expert career coach and interview trainer. Given a candidate's resume and a job description, generate tailored interview questions and preparation tips.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "questions": [
    { "category": "Behavioral", "question": "...", "guidance": "..." }
  ],
  "tips": ["...", "..."]
}

Rules:
- Generate 8–12 questions total across these categories: Behavioral, Technical, Situational, Culture fit
- Questions must be specific to the candidate's background and the role — not generic
- Guidance: 2–4 sentences on key points to address, not a script. Help the candidate know what to emphasize.
- Tips: 5 actionable preparation tips tailored to this specific role and candidate
- Return only the JSON object, nothing else`,
      messages: [
        {
          role: 'user',
          content: `Job description:\n\n${jobDescription.slice(0, 12000)}\n\n---\n\nCandidate resume:\n\n${resumeText.slice(0, 15000)}\n\nGenerate the interview prep JSON.`,
        },
      ],
    });

    const textBlock = content.find((c) => c.type === 'text');
    const raw = textBlock && 'text' in textBlock ? (textBlock.text as string).trim() : '';

    if (!raw) {
      return NextResponse.json({ error: 'Could not generate interview prep.' }, { status: 500 });
    }

    let result: InterviewPrepResult;
    try {
      result = JSON.parse(raw) as InterviewPrepResult;
    } catch {
      // Try to extract JSON from within the response in case Claude added extra text
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: 'Could not parse response.' }, { status: 500 });
      }
      result = JSON.parse(match[0]) as InterviewPrepResult;
    }

    if (!Array.isArray(result.questions) || !Array.isArray(result.tips)) {
      return NextResponse.json({ error: 'Invalid response format.' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Interview prep error:', err);
    return NextResponse.json({ error: 'Failed to generate interview prep.' }, { status: 500 });
  }
}
