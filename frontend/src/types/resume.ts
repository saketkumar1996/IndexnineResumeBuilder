/**
 * TypeScript interfaces mirroring backend Pydantic models
 * Ensures exact type compatibility between frontend and backend
 * Requirements: 1.5, 5.5
 */

export interface HeaderData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
}

export interface ExpertiseData {
  summary: string;
}

export interface SkillsData {
  skills: string;
}

export interface ExperienceData {
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  responsibilities: string[];
}

export interface ProjectData {
  name: string;
  description: string;
  technologies: string;
  start_date: string;
  end_date?: string;
}

export interface EducationData {
  institution: string;
  degree: string;
  field_of_study: string;
  graduation_date: string;
  gpa?: string;
}

export interface AwardData {
  title: string;
  organization: string;
  date: string;
  description?: string;
}

export interface ResumeData {
  header: HeaderData;
  expertise: ExpertiseData;
  skills: SkillsData;
  experience: ExperienceData[];
  projects: ProjectData[];
  education: EducationData[];
  awards?: AwardData[];
}

// API Response Types
export interface ValidationError {
  field: string;
  message: string;
  type: string;
  input?: any;
  spec_reference?: string;
}

export interface ValidationResponse {
  valid: boolean;
  errors?: ValidationError[];
  data?: ResumeData;
}

export interface PreviewResponse {
  html: string;
  valid: boolean;
  errors?: ValidationError[];
}