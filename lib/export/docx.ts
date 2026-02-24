import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  convertInchesToTwip,
} from 'docx';
import type { ExportTemplate } from './templates';

function isLikelyHeading(line: string): boolean {
  const t = line.trim();
  if (t.length > 80) return false;
  if (/^[A-Z][A-Z\s\-–—:]+$/.test(t)) return true;
  if (/:\s*$/.test(t) && t.length < 60) return true;
  return false;
}

export async function getFixedTextDocxBuffer(
  text: string,
  template: ExportTemplate = 'plain'
): Promise<Buffer> {
  const raw = text || 'No content.';
  const blocks = raw.split(/\n\n+/).filter(Boolean);
  const spacingAfter = convertInchesToTwip(template === 'academic' ? 0.2 : 0.15);

  const paragraphs = blocks.map((block) => {
    const heading = template !== 'plain' && isLikelyHeading(block);
    return new Paragraph({
      children: [new TextRun(block)],
      heading: heading ? HeadingLevel.HEADING_2 : undefined,
      spacing: { after: spacingAfter },
    });
  });

  if (paragraphs.length === 0) {
    paragraphs.push(
      new Paragraph({ children: [new TextRun('No content.')] })
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
