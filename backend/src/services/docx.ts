import { Document, HeadingLevel, Packer, Paragraph } from "docx";
import {
  PROFESSIONAL_EXPERIENCE_BULLET_LIMIT,
  PROJECT_EXPERIENCE_BULLET_LIMIT,
} from "../types/resume";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const record = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const text = (value: unknown): string => (value === undefined || value === null ? "" : String(value));

const joinPipes = (values: unknown[]): string => values.map(text).filter(Boolean).join(" | ");

/** Trims spaces and pipes from both ends only, leaving interior separators alone. */
const stripPipes = (value: string): string => value.replace(/^[\s|]+/, "").replace(/[\s|]+$/, "");

const title = (value: string) => new Paragraph({ text: value, heading: HeadingLevel.TITLE });
const heading1 = (value: string) => new Paragraph({ text: value, heading: HeadingLevel.HEADING_1 });
const body = (value: string) => new Paragraph({ text: value });
const bullet = (value: string) => new Paragraph({ text: value, bullet: { level: 0 } });

const bullets = (items: unknown[], limit?: number): Paragraph[] => {
  const selected = limit ? items.slice(0, limit) : items;
  return selected
    .map((item) => text(item).trim())
    .filter(Boolean)
    .map(bullet);
};

export const filenameFromResume = (resumeData: unknown, extension: string): string => {
  const header = record(record(resumeData).header);
  const name = text(header.fullName) || text(header.name) || "resume";
  const safeName = name.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "resume";
  return `${safeName}.${extension}`;
};

/** Builds an editable Word document from the frontend resume shape. */
export const generateDocxBuffer = async (resumeData: unknown): Promise<Buffer> => {
  const data = record(resumeData);
  const header = record(data.header);
  const expertise = record(data.expertise);
  const skills = record(data.skills);

  const children: Paragraph[] = [];

  children.push(title(text(header.fullName) || text(header.name) || "Resume"));

  const contact = joinPipes([
    text(header.designation) || text(header.title),
    header.email,
    header.phone,
    header.location,
    header.linkedin,
    header.github,
    header.portfolio,
  ]);
  if (contact) children.push(body(contact));

  if (text(expertise.summary)) {
    children.push(heading1("Professional Summary"));
    children.push(body(text(expertise.summary)));
  }
  children.push(...bullets(list(expertise.bulletPoints)));

  if (text(skills.skills)) {
    children.push(heading1("Skills"));
    children.push(body(text(skills.skills)));
  }

  const experiences = list(data.experiences ?? data.experience);
  if (experiences.length) {
    children.push(heading1("Professional Experience"));
    for (const raw of experiences) {
      const exp = record(raw);
      const company = text(exp.company);
      const role = text(exp.title) || text(exp.position);
      const dates = [text(exp.startDate) || text(exp.start_date), text(exp.endDate) || text(exp.end_date)]
        .filter(Boolean)
        .join(" - ");
      children.push(body(stripPipes(`${role} | ${company} | ${dates}`)));
      children.push(...bullets(list(exp.responsibilities), PROFESSIONAL_EXPERIENCE_BULLET_LIMIT));
    }
  }

  const projects = list(data.projects);
  if (projects.length) {
    children.push(heading1("Selected Projects"));
    for (const raw of projects) {
      const project = record(raw);
      if (!text(project.name) && !text(project.description)) continue;
      children.push(bullet(text(project.name) || "Project"));
      if (text(project.technologies)) {
        children.push(body(`Technologies: ${text(project.technologies)}`));
      }
      if (text(project.description)) {
        children.push(body(text(project.description)));
      }
      children.push(...bullets(list(project.responsibilities), PROJECT_EXPERIENCE_BULLET_LIMIT));
    }
  }

  const education = list(data.education);
  if (education.length) {
    children.push(heading1("Education"));
    for (const raw of education) {
      const edu = record(raw);
      if (!text(edu.institution) && !text(edu.degree)) continue;
      const dates = [text(edu.startYear), text(edu.endYear)].filter(Boolean).join(" - ");
      children.push(body(stripPipes(`${text(edu.degree)} | ${text(edu.institution)} | ${dates}`)));
    }
  }

  const awards = list(data.awards);
  if (awards.length) {
    children.push(heading1("Awards & Certifications"));
    for (const raw of awards) {
      const award = record(raw);
      if (!text(award.title)) continue;
      children.push(bullet(joinPipes([award.title, award.organization, award.year])));
    }
  }

  const document = new Document({ sections: [{ children }] });
  return Packer.toBuffer(document);
};
