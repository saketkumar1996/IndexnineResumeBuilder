export const RESUME_SCHEMA_PROMPT = `You are a resume parser. Extract structured resume data from the uploaded resume document (PDF or DOCX).

Return ONLY valid JSON (no markdown, no code fences, no explanation). Use this exact structure:

{
  "header": {
    "fullName": "string",
    "designation": "string",
    "email": "string or empty",
    "phone": "string or empty",
    "location": "string or empty",
    "linkedin": "string or empty",
    "github": "string or empty",
    "portfolio": "string or empty"
  },
  "expertise": {
    "summary": "string, 50-200 words professional summary",
    "bulletPoints": ["string", "string"]
  },
  "skills": { "skills": "comma-separated string" },
  "experiences": [
    { "company": "", "title": "", "location": "", "startDate": "MMM YYYY", "endDate": "MMM YYYY or Present", "responsibilities": ["up to 3 resume bullets if present"] }
  ],
  "projects": [
    {
      "name": "",
      "client": "",
      "description": "",
      "technologies": "",
      "developmentTools": "",
      "teamSize": "",
      "responsibilities": ["up to 2 resume bullets if present"],
      "link": ""
    }
  ],
  "education": [
    { "institution": "", "degree": "", "location": "", "startYear": "YYYY", "endYear": "YYYY", "gpa": "", "honors": "" }
  ],
  "awards": [
    { "title": "", "year": "YYYY", "organization": "" }
  ]
}

Rules:
- Use empty string for missing scalar fields and [] for missing responsibility arrays.
- Dates: "Jan 2020", "Present". Years: "2015", "2019".
- Extract up to 3 real bullets for each Professional Experience entry if bullets are present. Do not create bullets when the resume has none.
- Extract all project descriptions and up to 2 real project responsibility bullets for each Selected Project if bullets are present.
- If a project has bullets but no explicit description paragraph, use the first project bullet as description and put the remaining bullets in responsibilities.
- Do not put project descriptions in responsibilities only.
- Extract everything you can find; omit arrays only if none found.`;

export const JOB_MATCH_SYSTEM =
  "Return only JSON with keys: score number 0-100, missingKeywords string[], strengths string[], risks string[], sectionSuggestions object. Be concise and practical.";

export const IMPROVE_BULLET_SYSTEM =
  'Return only JSON: {"options":[{"style":"concise","text":""},{"style":"impact","text":""},{"style":"metrics","text":""}]}. No emojis. Keep each option one resume bullet.';

export const COVER_LETTER_SYSTEM =
  'Return only JSON: {"content": "cover letter text"}. Write a polished, concise, role-specific cover letter without invented facts.';
