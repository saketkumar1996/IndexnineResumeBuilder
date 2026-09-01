import {
  PROFESSIONAL_EXPERIENCE_BULLET_LIMIT,
  PROJECT_EXPERIENCE_BULLET_LIMIT,
  type LooseResumeData,
} from "../types/resume";

const MONTHS: Record<string, string> = {
  jan: "JAN",
  january: "JAN",
  feb: "FEB",
  february: "FEB",
  mar: "MAR",
  march: "MAR",
  apr: "APR",
  april: "APR",
  may: "MAY",
  jun: "JUN",
  june: "JUN",
  jul: "JUL",
  july: "JUL",
  aug: "AUG",
  august: "AUG",
  sep: "SEP",
  sept: "SEP",
  september: "SEP",
  oct: "OCT",
  october: "OCT",
  nov: "NOV",
  november: "NOV",
  dec: "DEC",
  december: "DEC",
};

const MONTH_ABBREV = ["", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const RANGE_SPLIT = /\s*–\s*|\s*—\s*|\s+-\s+|\s+(?:to|until|thru|through)\s+/i;
const PRESENT_WORDS = new Set(["present", "current", "now", "ongoing"]);

const isDigits = (value: string): boolean => value.length > 0 && /^\d+$/.test(value);

const fourDigitYear = (value: string): string => {
  if (isDigits(value) && value.length === 4) return value;
  if (isDigits(value) && value.length === 2) {
    const year = Number.parseInt(value, 10);
    return String(year >= 50 ? 1900 + year : 2000 + year);
  }
  return "";
};

const monthFromNumber = (value: string): string => {
  if (!isDigits(value)) return "";
  const month = Number.parseInt(value, 10);
  return month >= 1 && month <= 12 ? MONTH_ABBREV[month] : "";
};

/** Normalizes any recognizable date to `MMM YYYY`, or `Present`. */
export const normalizeDate = (value: unknown, fallbackMonth = "JAN"): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (PRESENT_WORDS.has(raw.toLowerCase())) return "Present";

  const named = /\b([A-Za-z]+)\.?,?\s+'?(\d{2}|\d{4})\b/.exec(raw);
  if (named) {
    const month = MONTHS[named[1].toLowerCase()];
    const year = fourDigitYear(named[2]);
    if (month && year) return `${month} ${year}`;
  }

  const numeric =
    /\b(\d{1,2})[/\-.](\d{2}|\d{4})\b/.exec(raw) || /\b(\d{4})[/\-.](\d{1,2})(?:[/\-.]\d{1,2})?\b/.exec(raw);
  if (numeric) {
    const [, first, second] = numeric;
    if (first.length === 4) {
      const month = monthFromNumber(second);
      if (month) return `${month} ${first}`;
    } else {
      const month = monthFromNumber(first);
      const year = fourDigitYear(second);
      if (month && year) return `${month} ${year}`;
    }
  }

  const parts = raw.replace(/\//g, " ").replace(/-/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const month = MONTHS[parts[0].toLowerCase()] || "";
    const year = fourDigitYear(parts[parts.length - 1]);
    if (month && year) return `${month} ${year}`;
  }

  if (isDigits(raw) && raw.length === 4) return `${fallbackMonth} ${raw}`;
  return raw.toUpperCase();
};

/** Splits a combined "Jan 2021 - Present" string when only one field was filled. */
export const parseExperienceDates = (startRaw: unknown, endRaw: unknown): [string, string] => {
  let start = String(startRaw ?? "").trim();
  let end = String(endRaw ?? "").trim();

  if (start && !end && RANGE_SPLIT.test(start)) {
    const parts = start
      .split(RANGE_SPLIT)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      start = parts[0];
      end = parts[1];
    }
  }

  let startDate = normalizeDate(start);
  if (startDate.toLowerCase() === "present") startDate = "";
  return [startDate, normalizeDate(end)];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nonEmptyList = (values: unknown): string[] => {
  if (!Array.isArray(values)) return [];
  return values.map((value) => String(value ?? "").trim()).filter(Boolean);
};

const cleanText = (value: unknown): string => String(value || "").replace(/\s+/g, " ").trim();

const firstText = (source: Record<string, unknown>, ...keys: string[]): string => {
  for (const key of keys) {
    let value = source[key];
    if (Array.isArray(value)) {
      value = value.map(cleanText).find(Boolean) ?? "";
    }
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
};

const textList = (value: unknown): string[] => {
  let items: unknown[];
  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === "string" && (value.includes("\n") || value.includes("\u2022"))) {
    items = value.split(/[\n\u2022]+/);
  } else if (value) {
    items = [value];
  } else {
    items = [];
  }

  const cleaned: string[] = [];
  for (const item of items) {
    const source = isRecord(item)
      ? firstText(item, "text", "description", "summary", "responsibility", "title")
      : item;
    const text = cleanText(source).replace(/^[\s\-\u2022*]+/, "");
    if (text) cleaned.push(text);
  }
  return cleaned;
};

const firstTextList = (source: Record<string, unknown>, ...keys: string[]): string[] => {
  for (const key of keys) {
    const values = textList(source[key]);
    if (values.length) return values;
  }
  return [];
};

const itemList = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (isRecord(value)) return [value];
  return [];
};

const normalizeUploadedProject = (project: unknown) => {
  const source = isRecord(project) ? project : {};
  let responsibilities = firstTextList(
    source,
    "responsibilities",
    "responsibility",
    "bullets",
    "bulletPoints",
    "highlights",
    "achievements",
    "contributions",
    "tasks"
  );
  let description = firstText(source, "description", "projectDescription", "summary", "overview", "details");
  if (!description && responsibilities.length) {
    description = responsibilities[0];
    responsibilities = responsibilities.slice(1);
  }

  return {
    name: firstText(source, "name", "projectName", "title"),
    client: firstText(source, "client", "clientName", "product"),
    description,
    technologies: firstText(source, "technologies", "technologyStack", "techStack", "tools", "environment"),
    developmentTools: firstText(source, "developmentTools", "development_tools", "devTools"),
    teamSize: firstText(source, "teamSize", "team_size"),
    responsibilities: responsibilities.slice(0, PROJECT_EXPERIENCE_BULLET_LIMIT),
    link: firstText(source, "link", "url"),
  };
};

const normalizeUploadedExperience = (experience: unknown) => {
  const source = isRecord(experience) ? experience : {};
  const [startDate, endDate] = parseExperienceDates(
    firstText(source, "startDate", "start_date", "from"),
    firstText(source, "endDate", "end_date", "to")
  );
  return {
    company: firstText(source, "company", "employer", "organization"),
    title: firstText(source, "title", "position", "role", "designation"),
    location: firstText(source, "location", "city"),
    startDate,
    endDate,
    responsibilities: firstTextList(
      source,
      "responsibilities",
      "responsibility",
      "bullets",
      "bulletPoints",
      "achievements",
      "highlights",
      "contributions"
    ).slice(0, PROFESSIONAL_EXPERIENCE_BULLET_LIMIT),
  };
};

/**
 * Post-processes the AI's resume JSON: resolves field aliases, normalizes dates and
 * clamps bullet counts to the limits the templates render.
 */
export const normalizeUploadedResumeData = (input: unknown): LooseResumeData => {
  const data = isRecord(input) ? input : {};
  const header = isRecord(data.header) ? data.header : {};
  const expertise = isRecord(data.expertise) ? data.expertise : {};
  const skills = isRecord(data.skills) ? data.skills : {};

  return {
    ...data,
    header: {
      fullName: firstText(header, "fullName", "name"),
      designation: firstText(header, "designation", "title"),
      email: firstText(header, "email"),
      phone: firstText(header, "phone"),
      location: firstText(header, "location"),
      linkedin: firstText(header, "linkedin", "linkedIn"),
      github: firstText(header, "github", "gitHub"),
      portfolio: firstText(header, "portfolio", "website"),
    },
    expertise: {
      summary: firstText(expertise, "summary", "profile", "objective"),
      bulletPoints: firstTextList(expertise, "bulletPoints", "bullets", "highlights"),
    },
    skills: {
      skills: firstText(skills, "skills", "technicalSkills") || cleanText(data.skills),
    },
    experiences: itemList(data.experiences ?? data.experience).map(normalizeUploadedExperience),
    projects: itemList(data.projects ?? data.project).map(normalizeUploadedProject),
    education: itemList(data.education),
    awards: itemList(data.awards),
  };
};

/** Flattens a resume into plain text for AI prompts. */
export const resumeText = (input: unknown): string => {
  const data = isRecord(input) ? input : {};
  const header = isRecord(data.header) ? data.header : {};
  const expertise = isRecord(data.expertise) ? data.expertise : {};
  const skills = isRecord(data.skills) ? data.skills : {};

  const parts: string[] = [
    String(header.fullName || header.name || ""),
    String(header.designation || header.title || ""),
    String(expertise.summary || ""),
    String(skills.skills || ""),
  ];

  for (const raw of itemList(data.experiences ?? data.experience)) {
    const exp = isRecord(raw) ? raw : {};
    parts.push(
      String(exp.company || ""),
      String(exp.title || exp.position || ""),
      nonEmptyList(exp.responsibilities).join(" ")
    );
  }

  for (const raw of itemList(data.projects)) {
    const project = isRecord(raw) ? raw : {};
    parts.push(
      String(project.name || ""),
      String(project.description || ""),
      String(project.technologies || ""),
      nonEmptyList(project.responsibilities).join(" ")
    );
  }

  return parts.filter(Boolean).join("\n");
};
