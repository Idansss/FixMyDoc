/** Export layout template. 'plain' = current behavior; others use styled PDF/DOCX. */
export type ExportTemplate = 'plain' | 'cv' | 'academic' | 'proposal';

export const EXPORT_TEMPLATE_LABELS: Record<ExportTemplate, string> = {
  plain: 'Plain',
  cv: 'CV / Resume',
  academic: 'Academic',
  proposal: 'Proposal / Business',
};

/** Suggest template from document type. */
export function templateForDocType(docType: string): ExportTemplate {
  switch (docType?.toLowerCase()) {
    case 'cv':
      return 'cv';
    case 'academic':
      return 'academic';
    case 'business':
    case 'legal':
      return 'proposal';
    default:
      return 'plain';
  }
}
