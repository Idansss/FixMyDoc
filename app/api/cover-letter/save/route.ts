import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content } = body as { title?: string; content?: string };

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'Missing or invalid content.' },
        { status: 400 }
      );
    }

    const filename = (title && title.trim()) ? `${title.trim()}.txt` : 'Cover letter.txt';

    const { data: doc, error: docError } = await supabaseServer
      .from('documents')
      .insert({
        user_id: userId,
        filename,
        doc_type: 'cover_letter',
        score: null,
        extracted_text: content.trim(),
      })
      .select('id')
      .single();

    if (docError || !doc) {
      console.error('Cover letter save document error:', docError);
      return NextResponse.json(
        { error: 'Failed to save document' },
        { status: 500 }
      );
    }

    const { error: rewriteError } = await supabaseServer
      .from('rewrites')
      .insert({
        document_id: doc.id,
        original_text: content.trim(),
        fixed_text: content.trim(),
        analysis_result: {},
      });

    if (rewriteError) {
      console.error('Cover letter save rewrite error:', rewriteError);
      await supabaseServer.from('documents').delete().eq('id', doc.id).eq('user_id', userId);
      return NextResponse.json(
        { error: 'Failed to save cover letter' },
        { status: 500 }
      );
    }

    return NextResponse.json({ documentId: doc.id });
  } catch (err) {
    console.error('Cover letter save error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
