/**
 * Mirrors frontend/src/types/resume.ts. This is the stored/uploaded/exported contract,
 * so the two files must be kept in sync.
 */

export interface HeaderData {
  fullName: string;
  designation: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ExpertiseData {
  summary: string;
  bulletPoints?: string[];
}

export interface SkillsData {
  skills: string;
}

export interface ExperienceData {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate?: string;
  responsibilities?: string[];
}

export interface ProjectData {
  name: string;
  description: string;
  technologies: string;
  link?: string;
  client?: string;
  developmentTools?: string;
  teamSize?: string;
  responsibilities?: string[];
}

export interface EducationData {
  institution: string;
  degree: string;
  location: string;
  startYear: string;
  endYear: string;
  gpa?: string;
  honors?: string;
}

export interface AwardData {
  title: string;
  year: string;
  organization?: string;
}

export interface ResumeData {
  header: HeaderData;
  expertise: ExpertiseData;
  skills: SkillsData;
  experiences: ExperienceData[];
  projects: ProjectData[];
  education: EducationData[];
  awards?: AwardData[];
}

export const PROFESSIONAL_EXPERIENCE_BULLET_LIMIT = 3;
export const PROJECT_EXPERIENCE_BULLET_LIMIT = 2;

/** Resume payloads are stored as-is, so treat them as loose records internally. */
export type LooseResumeData = Record<string, unknown>;
