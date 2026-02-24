import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch documents with their latest rewrite id
    const { data: docs, error } = await supabaseServer
      .from('documents')
      .select('id, filename, doc_type, score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Documents fetch error:', error);
      return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 });
    }

    if (!docs || docs.length === 0) {
      return NextResponse.json({ documents: [] });
    }

    // Fetch the latest rewrite id for each document
    const docIds = docs.map((d) => d.id);
    const { data: rewrites } = await supabaseServer
      .from('rewrites')
      .select('id, document_id, created_at')
      .in('document_id', docIds)
      .order('created_at', { ascending: false });

    // Map document_id -> latest rewrite id
    const latestRewrite: Record<string, string> = {};
    if (rewrites) {
      for (const rw of rewrites) {
        if (!latestRewrite[rw.document_id]) {
          latestRewrite[rw.document_id] = rw.id;
        }
      }
    }

    const result = docs.map((doc) => ({
      id: doc.id,
      filename: doc.filename,
      docType: doc.doc_type,
      score: doc.score ?? null,
      status: latestRewrite[doc.id] ? 'analyzed' : 'uploaded',
      date: new Date(doc.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      createdAt: doc.created_at,
      rewriteId: latestRewrite[doc.id] ?? null,
    }));

    return NextResponse.json({ documents: result });
  } catch (err) {
    console.error('Documents route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
