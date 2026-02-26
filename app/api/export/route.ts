import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getFixedTextPdfBuffer } from '@/lib/export/pdf';
import { getFixedTextDocxBuffer } from '@/lib/export/docx';
import { templateForDocType, type ExportTemplate } from '@/lib/export/templates';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { rewriteId, format, fixedText: fixedTextOverride, template: templateOverride, branded } = body as {
      rewriteId?: string;
      format?: string;
      fixedText?: string;
      template?: ExportTemplate;
      /** Optional: add "Created with FixMyDoc" footer to PDF/DOCX. */
      branded?: boolean;
    };

    if (!rewriteId || !format) {
      return NextResponse.json(
        { error: 'Missing rewriteId or format' },
        { status: 400 }
      );
    }

    const { data: user } = await supabaseServer
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();

    const plan = user?.plan ?? 'free';

    if (format !== 'pdf' && format !== 'docx' && format !== 'txt') {
      return NextResponse.json(
        { error: 'Invalid format. Use pdf, docx, or txt.' },
        { status: 400 }
      );
    }

    if ((format === 'pdf' || format === 'docx') && plan === 'free') {
      return NextResponse.json(
        { error: 'upgrade_required' },
        { status: 403 }
      );
    }

    const { data: rewrite } = await supabaseServer
      .from('rewrites')
      .select('id, fixed_text, document_id')
      .eq('id', rewriteId)
      .single();

    const { data: doc } = rewrite
      ? await supabaseServer
          .from('documents')
          .select('id, user_id, doc_type')
          .eq('id', rewrite.document_id)
          .eq('user_id', userId)
          .single()
      : { data: null };

    if (!rewrite || !doc) {
      return NextResponse.json({ error: 'Rewrite not found' }, { status: 404 });
    }

    let fixedText =
      typeof fixedTextOverride === 'string' && fixedTextOverride.trim() !== ''
        ? fixedTextOverride.trim()
        : (rewrite.fixed_text || '');

    if (branded && (format === 'pdf' || format === 'docx')) {
      fixedText = fixedText + '\n\n— Created with FixMyDoc';
    }

    const docType = (doc as { doc_type?: string }).doc_type;
    const template: ExportTemplate =
      templateOverride && ['plain', 'cv', 'academic', 'proposal'].includes(templateOverride)
        ? templateOverride
        : templateForDocType(docType ?? '');

    if (format === 'txt') {
      return new NextResponse(fixedText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="fixmydoc-export-${rewriteId}.txt"`,
        },
      });
    }

    if (format === 'pdf') {
      const buffer = await getFixedTextPdfBuffer(fixedText, template);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="fixmydoc-export-${rewriteId}.pdf"`,
        },
      });
    }

    const docxBuffer = await getFixedTextDocxBuffer(fixedText, template);
    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="fixmydoc-export-${rewriteId}.docx"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
