import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getFixedTextPdfBuffer } from '@/lib/export/pdf';
import { getFixedTextDocxBuffer } from '@/lib/export/docx';

export const dynamic = 'force-dynamic';

const BRANDED_FOOTER = '\n\n— Created with FixMyDoc';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { text, format, branded } = body as {
      text?: string;
      format?: string;
      branded?: boolean;
    };

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text.' },
        { status: 400 }
      );
    }

    if (!format || !['txt', 'pdf', 'docx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use txt, pdf, or docx.' },
        { status: 400 }
      );
    }

    const { data: user } = await supabaseServer
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();
    const plan = user?.plan ?? 'free';

    if ((format === 'pdf' || format === 'docx') && plan === 'free') {
      return NextResponse.json(
        { error: 'upgrade_required' },
        { status: 403 }
      );
    }

    const content = branded ? (text.trim() + BRANDED_FOOTER) : text.trim();

    if (format === 'txt') {
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="fixmydoc-cover-letter.txt"',
        },
      });
    }

    if (format === 'pdf') {
      const buffer = await getFixedTextPdfBuffer(content, 'plain');
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="fixmydoc-cover-letter.pdf"',
        },
      });
    }

    const docxBuffer = await getFixedTextDocxBuffer(content, 'plain');
    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="fixmydoc-cover-letter.docx"',
      },
    });
  } catch (err) {
    console.error('Cover letter export error:', err);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
