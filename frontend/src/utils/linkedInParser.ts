/**
 * Parses pasted LinkedIn profile text into ResumeData shape.
 * Handles common LinkedIn export/copy structure: About, Experience, Education, Skills.
 */

import type { ResumeData } from "@/types/resume";

const SECTION_HEADERS = [
  /^about$/im,
  /^experience$/im,
  /^education$/im,
  /^skills$/im,
  /^licenses\s+&\s+certifications$/im,
  /^projects$/im,
  /^honors\s+&\s+awards$/im,
];

const MONTHS: Record<string, string> = {
  jan: "JAN", january: "JAN",
  feb: "FEB", february: "FEB",
  mar: "MAR", march: "MAR",
  apr: "APR", april: "APR",
  may: "MAY",
  jun: "JUN", june: "JUN",
  jul: "JUL", july: "JUL",
  aug: "AUG", august: "AUG",
  sep: "SEP", sept: "SEP", september: "SEP",
  oct: "OCT", october: "OCT",
  nov: "NOV", november: "NOV",
  dec: "DEC", december: "DEC",
};

/** Normalize date to "MMM YYYY" or "Present" */
function normalizeDate(s: string): string {
  const t = s.trim();
  if (!t) return "";
  if (/present|current|now/i.test(t)) return "Present";
  const mmyy = t.match(/([a-z]+)\s*['']?\s*(\d{4})/i);
  if (mmyy) {
    const month = MONTHS[mmyy[1].toLowerCase()] || mmyy[1].toUpperCase().slice(0, 3);
    return `${month} ${mmyy[2]}`;
  }
  const yy = t.match(/(\d{4})/);
  if (yy) return yy[1];
  return t;
}

/** Extract 4-digit year */
function extractYear(s: string): string {
  const m = s.match(/(\d{4})/);
  return m ? m[1] : "";
}

/** Split text into sections by headers */
function splitSections(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = text.split(/\r?\n/);
  let currentKey = "preamble";
  let currentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    let found = false;
    for (const re of SECTION_HEADERS) {
      if (re.test(trimmed)) {
        if (currentLines.length) {
          sections.set(currentKey, currentLines.join("\n").trim());
        }
        currentKey = trimmed.toLowerCase().replace(/\s+&\s+/g, " ").slice(0, 20);
        if (/about/i.test(trimmed)) currentKey = "about";
        else if (/experience/i.test(trimmed)) currentKey = "experience";
        else if (/education/i.test(trimmed)) currentKey = "education";
        else if (/skills/i.test(trimmed)) currentKey = "skills";
        else if (/projects/i.test(trimmed)) currentKey = "projects";
        else if (/honors|awards/i.test(trimmed)) currentKey = "awards";
        currentLines = [];
        found = true;
        break;
      }
    }
    if (!found) currentLines.push(line);
  }
  if (currentLines.length) {
    sections.set(currentKey, currentLines.join("\n").trim());
  }
  return sections;
}

/** Parse preamble for name and headline */
function parsePreamble(preamble: string): { fullName?: string; designation?: string } {
  const lines = preamble.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return {};
  const fullName = lines[0];
  const designation = lines[1] ?? "";
  return { fullName, designation };
}

/** Parse experience block into experiences */
function parseExperience(block: string): ResumeData["experiences"] {
  const entries: ResumeData["experiences"] = [];
  // Split by common "next role" patterns: "Title at Company" or new company line
  const chunks = block.split(/(?=\n[A-Z][^\n]*\s+(?:at|@|·|-)\s+[^\n]+)/);
  for (const chunk of chunks) {
    const lines = chunk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    let title = "";
    let company = "";
    let location = "";
    let startDate = "";
    let endDate = "";

    const first = lines[0];
    const atMatch = first.match(/^(.+?)\s+(?:at|@|·|-)\s+(.+)$/i);
    if (atMatch) {
      title = atMatch[1].trim();
      company = atMatch[2].trim();
    } else {
      company = first;
      title = lines[1] ?? "";
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const dateRange = line.match(/([A-Za-z]+\s*['']?\s*\d{4}|(?:\d{1,2}\/\d{4}))\s*[-–—]\s*([A-Za-z]+\s*['']?\s*\d{4}|(?:\d{1,2}\/\d{4})|Present|Current)/i);
      if (dateRange) {
        startDate = normalizeDate(dateRange[1]);
        endDate = normalizeDate(dateRange[2]);
      }
      if (/^[\d\w\s,\.\-]+$/.test(line) && line.length < 80 && !startDate && !/^\d/.test(line)) {
        if (!location) location = line;
      }
    }

    if (company || title) {
      entries.push({
        company: company || "Company",
        title: title || "Role",
        location: location || "",
        startDate: startDate || "",
        endDate: endDate || "",
      });
    }
  }

  if (entries.length === 0) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i += 3) {
      const company = lines[i] ?? "";
      const title = lines[i + 1] ?? "";
      const dateLine = lines[i + 2] ?? "";
      const dr = dateLine.match(/(.+?)\s*[-–—]\s*(.+)/);
      if (company && title) {
        entries.push({
          company,
          title,
          location: "",
          startDate: dr ? normalizeDate(dr[1]) : "",
          endDate: dr ? normalizeDate(dr[2]) : "",
        });
      }
    }
  }
  return entries;
}

/** Parse education block */
function parseEducation(block: string): ResumeData["education"] {
  const entries: ResumeData["education"] = [];
  const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let i = 0;
  while (i < lines.length) {
    const institution = lines[i] ?? "";
    const degree = lines[i + 1] ?? "";
    const rest = (lines[i + 2] ?? "") + " " + (lines[i + 3] ?? "");
    const years = rest.match(/(\d{4})\s*[-–—]?\s*(\d{4})?/) ?? rest.match(/(\d{4})/);
    const startYear = years ? (years[1] ?? "") : "";
    const endYear = years && years[2] ? years[2] : years ? years[1] ?? "" : "";
    if (institution && (degree || startYear)) {
      entries.push({
        institution,
        degree: degree || "Degree",
        location: "",
        startYear,
        endYear,
        gpa: "",
        honors: "",
      });
      i += degree ? 2 : 1;
    }
    i += 1;
  }
  if (entries.length === 0 && lines.length >= 2) {
    entries.push({
      institution: lines[0] ?? "",
      degree: lines[1] ?? "",
      location: "",
      startYear: extractYear(lines.join(" ") ?? ""),
      endYear: extractYear(lines.join(" ") ?? ""),
      gpa: "",
      honors: "",
    });
  }
  return entries;
}

/** Parse skills into comma-separated string */
function parseSkills(block: string): string {
  const list = block.split(/[\n,·•·]/).map((s) => s.trim()).filter(Boolean);
  return list.join(", ");
}

/**
 * Parse pasted LinkedIn-style text into partial ResumeData.
 * Matches schema: header, expertise.summary, skills, experiences, education, (projects/awards if present).
 */
export function parseLinkedInPaste(text: string): Partial<ResumeData> {
  if (!text || !text.trim()) return {};
  const sections = splitSections(text);
  const preamble = sections.get("preamble") ?? text.slice(0, 500);
  const { fullName, designation } = parsePreamble(preamble);
  const about = sections.get("about") ?? "";
  const experienceBlock = sections.get("experience") ?? "";
  const educationBlock = sections.get("education") ?? "";
  const skillsBlock = sections.get("skills") ?? "";

  const experiences = parseExperience(experienceBlock);
  const education = parseEducation(educationBlock);
  const skillsStr = parseSkills(skillsBlock);

  const result: Partial<ResumeData> = {};

  if (fullName || designation) {
    result.header = {
      fullName: fullName ?? "",
      designation: designation ?? "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
    };
  }

  if (about) {
    result.expertise = {
      summary: about.slice(0, 800),
      bulletPoints: [],
    };
  }

  if (skillsStr) {
    result.skills = { skills: skillsStr };
  }

  if (experiences.length) {
    result.experiences = experiences;
  }

  if (education.length) {
    result.education = education;
  }

  return result;
}
