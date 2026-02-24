import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-20250514';

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
      max_tokens: 2048,
      system: `You are an expert career coach. Write a professional, tailored cover letter that:
- Addresses the hiring manager (use "Hiring Manager" or "Dear Hiring Team" if no name given)
- Opens with a strong hook that ties the candidate's background to the role
- Highlights 2–3 relevant achievements or skills from the resume that match the job description
- Uses keywords from the job description naturally
- Keeps a confident but not arrogant tone
- Ends with a clear call to action and sign-off
- Is suitable for a single page (about 250–400 words)
Output only the cover letter text, no meta commentary.`,
      messages: [
        {
          role: 'user',
          content: `Job description:\n\n${jobDescription.slice(0, 12000)}\n\n---\n\nCandidate resume:\n\n${resumeText.slice(0, 15000)}\n\nWrite the cover letter.`,
        },
      ],
    });

    const textBlock = content.find((c) => c.type === 'text');
    const coverLetter = textBlock && 'text' in textBlock ? (textBlock.text as string).trim() : '';

    if (!coverLetter) {
      return NextResponse.json(
        { error: 'Could not generate cover letter.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ coverLetter });
  } catch (err) {
    console.error('Cover letter error:', err);
    return NextResponse.json(
      { error: 'Failed to generate cover letter.' },
      { status: 500 }
    );
  }
}
