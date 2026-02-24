export type DocType = 'cv' | 'legal' | 'academic' | 'business';

const BASE_JSON_SCHEMA =
  '{"score":number,"summary":"string","issues":[{"section":"string","problem":"string","severity":"string"}],"rewrites":[{"original":"string","improved":"string"}],"missing_sections":["string"]}';

const CV_ALWAYS_EXTRA =
  ',"cv_checklist":[{"item":"string","passed":boolean,"tip":"string"}],"stronger_verbs":[{"original":"string","suggested":"string"}]';

const ATS_JSON_EXTRA =
  ',"ats_score":number,"jd_match":number,"keyword_gap":["string"],"keyword_matched":["string"]';

/** When jobDescription is provided for docType cv, prompt includes ATS/JD matching. Optional industryOrRole tailors suggestions. */
export function getSystemPrompt(docType: DocType, jobDescription?: string | null, industryOrRole?: string | null): string {
  const base =
    'You are an expert document editor. Analyze the provided document and return ONLY a valid JSON object with no markdown, no code fences, no extra text. ';
  const byType: Record<DocType, string> = {
    cv: `${base}Focus on CVs/resumes: clarity, impact, consistency, formatting, and ATS-friendliness. Suggest concrete improvements for experience and skills. Use strong action verbs and quantified achievements where possible.`,
    legal: `${base}Focus on legal documents: precision, defined terms, consistency, clarity, and standard legal phrasing. Flag ambiguities and missing clauses.`,
    academic: `${base}Focus on academic writing: structure, argument flow, citations, tone, and clarity. Suggest improvements for thesis statements and evidence.`,
    business: `${base}Focus on business documents: professionalism, clarity, concision, and actionability. Improve proposals, reports, and emails.`,
  };

  let prompt = byType[docType];
  let schema = BASE_JSON_SCHEMA;

  if (docType === 'cv') {
    if (industryOrRole?.trim()) {
      prompt += ` The candidate is targeting: "${industryOrRole.trim()}". Use this to tailor checklist and verb suggestions (e.g. industry-relevant terms). `;
    }
    prompt += ` For CVs also include: (1) cv_checklist: array of 8-12 items. Each { "item": "short label e.g. Has quantified achievements", "passed": true/false, "tip": "one-line actionable tip if passed is false" }. Cover: quantified achievements, action verbs, keyword density, clear contact/summary, consistent formatting, length appropriateness, strong opening. (2) stronger_verbs: array of 3-6 items. Each { "original": "weak word or short phrase from the resume", "suggested": "stronger alternative e.g. orchestrated, led, delivered" }. `;
    schema = BASE_JSON_SCHEMA.slice(0, -1) + CV_ALWAYS_EXTRA + '}';
  }

  if (docType === 'cv' && jobDescription && jobDescription.trim()) {
    prompt += ` A job description is provided below. Also evaluate match: ats_score (0-100), jd_match (0-100), keyword_gap (important JD keywords missing or weak in the resume), keyword_matched (important JD keywords that DO appear well in the resume—max 15). `;
    schema = BASE_JSON_SCHEMA.slice(0, -1) + CV_ALWAYS_EXTRA + ATS_JSON_EXTRA + '}';
  }

  return prompt + ` Response must be exactly: ${schema}`;
}
