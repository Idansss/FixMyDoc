export type DocType = 'cv' | 'legal' | 'academic' | 'business';

const BASE_JSON_SCHEMA =
  '{"score":number,"summary":"string","issues":[{"section":"string","problem":"string","severity":"string"}],"rewrites":[{"original":"string","improved":"string"}],"missing_sections":["string"]}';

const ATS_JSON_EXTRA =
  ',"ats_score":number,"jd_match":number,"keyword_gap":["string"]';

/** When jobDescription is provided for docType cv, prompt includes ATS/JD matching and returns ats_score, jd_match, keyword_gap. */
export function getSystemPrompt(docType: DocType, jobDescription?: string | null): string {
  const base =
    'You are an expert document editor. Analyze the provided document and return ONLY a valid JSON object with no markdown, no code fences, no extra text. ';
  const byType: Record<DocType, string> = {
    cv: `${base}Focus on CVs/resumes: clarity, impact, consistency, formatting, and ATS-friendliness. Suggest concrete improvements for experience and skills.`,
    legal: `${base}Focus on legal documents: precision, defined terms, consistency, clarity, and standard legal phrasing. Flag ambiguities and missing clauses.`,
    academic: `${base}Focus on academic writing: structure, argument flow, citations, tone, and clarity. Suggest improvements for thesis statements and evidence.`,
    business: `${base}Focus on business documents: professionalism, clarity, concision, and actionability. Improve proposals, reports, and emails.`,
  };

  let prompt = byType[docType];
  let schema = BASE_JSON_SCHEMA;

  if (docType === 'cv' && jobDescription && jobDescription.trim()) {
    prompt += ` A job description is provided below. Also evaluate how well the resume matches the job: give an overall ATS-friendly score (ats_score, 0-100), job-description match percentage (jd_match, 0-100), and list important keywords from the job description that are missing or understated in the resume (keyword_gap, array of strings). `;
    schema = BASE_JSON_SCHEMA.slice(0, -1) + ATS_JSON_EXTRA + '}';
  }

  return prompt + ` Response must be exactly: ${schema}`;
}
