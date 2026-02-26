import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server';
import { ratelimit } from '@/lib/ratelimit';
import { ocrFromImageBuffer, ocrFromPdfBuffer, PDF_OCR_TEXT_THRESHOLD } from '@/lib/ocr';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!docType || !['cv', 'legal', 'academic', 'business'].includes(docType)) {
      return NextResponse.json(
        { error: 'Invalid or missing docType. Use: cv, legal, academic, business' },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_BYTES / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    const normalizedType = file.type.toLowerCase().replace(/\/x-/, '/');
    if (!ALLOWED_TYPES.some((t) => t === file.type || t === normalizedType)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use PDF, DOCX, or images (PNG, JPEG, WebP).' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText: string;

    try {
      if (file.type === 'application/pdf') {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        const text = (data.text ?? '').trim();
        if (text.length < PDF_OCR_TEXT_THRESHOLD) {
          extractedText = await ocrFromPdfBuffer(buffer);
          if (!extractedText.trim()) {
            extractedText = text || '(No text could be extracted. The PDF may be scanned or image-only; try a clearer scan or upload as images.)';
          } else {
            extractedText = extractedText.trim();
          }
        } else {
          extractedText = text;
        }
      } else if (
        file.type === 'image/png' ||
        file.type === 'image/jpeg' ||
        file.type === 'image/jpg' ||
        file.type === 'image/webp'
      ) {
        extractedText = await ocrFromImageBuffer(buffer);
        if (!extractedText) {
          extractedText = '(No text could be extracted. Ensure the image is clear and readable.)';
        }
      } else {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value ?? '';
      }
    } catch (extractErr) {
      console.error('Text extraction error:', extractErr);
      return NextResponse.json(
        { error: 'Could not extract text from this file. Try a different format or a clearer scan.' },
        { status: 422 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectPath = `${userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabaseServer.storage
      .from('documents')
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to store file' },
        { status: 500 }
      );
    }

    const { data: doc, error: docError } = await supabaseServer
      .from('documents')
      .insert({
        user_id: userId,
        filename: file.name,
        doc_type: docType,
        score: null,
        extracted_text: extractedText.trim() || null,
      })
      .select('id')
      .single();

    if (docError || !doc) {
      console.error('Documents insert error:', docError);
      return NextResponse.json(
        { error: 'Failed to save document record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documentId: doc.id,
      extractedText: extractedText.trim() || '(no text extracted)',
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
