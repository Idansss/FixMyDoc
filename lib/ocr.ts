import { createWorker } from 'tesseract.js';

/** Minimum text length from pdf-parse below which we consider the PDF "scanned" and run OCR. */
export const PDF_OCR_TEXT_THRESHOLD = 80;

/**
 * Run OCR on an image buffer (PNG, JPEG, etc.). Returns extracted text or empty string on failure.
 */
export async function ocrFromImageBuffer(buffer: Buffer): Promise<string> {
  const worker = await createWorker('eng', 1, { logger: () => {} });
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return (text ?? '').trim();
  } finally {
    await worker.terminate();
  }
}

/**
 * Run OCR on a PDF buffer by converting each page to an image and running Tesseract.
 * Uses pdf-to-img with a data URL. Returns concatenated text from all pages.
 */
export async function ocrFromPdfBuffer(buffer: Buffer): Promise<string> {
  const { pdf } = await import('pdf-to-img');
  const dataUrl = `data:application/pdf;base64,${buffer.toString('base64')}`;
  const document = await pdf(dataUrl, { scale: 2 });
  const parts: string[] = [];
  const worker = await createWorker('eng', 1, { logger: () => {} });
  try {
    for await (const pageImage of document) {
      const {
        data: { text },
      } = await worker.recognize(Buffer.from(pageImage));
      if (text?.trim()) parts.push(text.trim());
    }
    return parts.join('\n\n');
  } finally {
    await worker.terminate();
  }
}
