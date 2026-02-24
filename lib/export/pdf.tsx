import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { ExportTemplate } from './templates';

const plainStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  text: { lineHeight: 1.5, marginBottom: 8, textAlign: 'left' },
});

const cvStyles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 10 },
  section: { marginBottom: 14 },
  heading: { fontSize: 12, marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  text: { lineHeight: 1.45, marginBottom: 4, textAlign: 'left' },
});

const academicStyles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 12 },
  section: { marginBottom: 16 },
  heading: { fontSize: 14, marginBottom: 8, fontFamily: 'Helvetica-Bold' },
  text: { lineHeight: 1.6, marginBottom: 10, textAlign: 'left' },
});

const proposalStyles = StyleSheet.create({
  page: { padding: 45, fontFamily: 'Helvetica', fontSize: 11 },
  section: { marginBottom: 12 },
  heading: { fontSize: 11, marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  text: { lineHeight: 1.5, marginBottom: 8, textAlign: 'left' },
});

/** Heuristic: treat short ALL-CAPS or lines ending with colon as section headers for styled templates. */
function isLikelyHeading(line: string): boolean {
  const t = line.trim();
  if (t.length > 80) return false;
  if (/^[A-Z][A-Z\s\-–—:]+$/.test(t)) return true;
  if (/:\s*$/.test(t) && t.length < 60) return true;
  return false;
}

function PdfContent({ text, template }: { text: string; template: ExportTemplate }) {
  const raw = text || 'No content.';
  const paragraphs = raw.split(/\n\n+/).filter(Boolean);

  if (template === 'plain') {
    return (
      <Document>
        <Page size="A4" style={plainStyles.page}>
          <View>
            {paragraphs.map((p, i) => (
              <Text key={i} style={plainStyles.text}>{p}</Text>
            ))}
          </View>
        </Page>
      </Document>
    );
  }

  const styledStyles =
    template === 'cv' ? cvStyles : template === 'academic' ? academicStyles : proposalStyles;
  return (
    <Document>
      <Page size="A4" style={styledStyles.page}>
        <View>
          {paragraphs.map((p, i) => {
            const heading = isLikelyHeading(p);
            return (
              <View key={i} style={styledStyles.section}>
                <Text style={heading ? styledStyles.heading : styledStyles.text}>{p}</Text>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}

export async function getFixedTextPdfBuffer(
  text: string,
  template: ExportTemplate = 'plain'
): Promise<Buffer> {
  const content = React.createElement(PdfContent, { text, template });
  const blob = await renderToBuffer(content as React.ReactElement);
  return Buffer.from(blob);
}
