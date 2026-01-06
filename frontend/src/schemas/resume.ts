/**
 * Zod validation schemas matching backend Pydantic models
 * Implements identical validation rules: regex patterns, length constraints, custom validators
 * Requirements: 1.5, 5.5
 */

import { z } from 'zod';

// Emoji validation regex (matches backend pattern)
const EMOJI_PATTERN = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}]/u;

// Custom validation functions
const validateWordCount = (value: string) => {
  if (!value || value.trim() === '') {
    return true; // Allow empty during editing
  }
  const wordCount = value.split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount < 80 || wordCount > 120) {
    throw new Error(`Summary must be 80-120 words, got ${wordCount}`);
  }
  return true;
};

const validateCommaSeparated = (value: string) => {
  if (!value || value.trim() === '') {
    return true; // Allow empty during editing
  }
  if (!value.includes(',')) {
    throw new Error('Skills must be in comma-separated format');
  }
  
  // Check each skill for emojis
  const skills = value.split(',').map(skill => skill.trim());
  for (const skill of skills) {
    if (EMOJI_PATTERN.test(skill)) {
      throw new Error('Skills cannot contain emojis, icons, or graphics');
    }
  }
  
  return true;
};

const validateMinResponsibilities = (responsibilities: string[]) => {
  if (!responsibilities || responsibilities.length === 0) {
    return true; // Allow empty during editing
  }
  
  // Filter out empty responsibilities
  const nonEmptyResponsibilities = responsibilities.filter(r => r && r.trim());
  
  if (nonEmptyResponsibilities.length > 0 && nonEmptyResponsibilities.length < 3) {
    throw new Error('Minimum 3 responsibilities required');
  }
  
  // Check each responsibility for emojis and empty values
  for (const responsibility of nonEmptyResponsibilities) {
    if (EMOJI_PATTERN.test(responsibility)) {
      throw new Error('Responsibilities cannot contain emojis, icons, or graphics');
    }
  }
  
  return true;
};

// Header Schema
export const HeaderSchema = z.object({
  name: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Name cannot contain emojis, icons, or graphics'
    }),
  
  title: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Title cannot contain emojis, icons, or graphics'
    }),
  
  email: z.string()
    .refine(val => !val || /^[^@]+@[^@]+\.[^@]+$/.test(val), {
      message: 'Invalid email format'
    }),
  
  phone: z.string()
    .refine(val => !val || /^\+?[\d\s\-\(\)]+$/.test(val), {
      message: 'Invalid phone format'
    }),
  
  location: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Location cannot contain emojis, icons, or graphics'
    })
});

// Expertise Schema
export const ExpertiseSchema = z.object({
  summary: z.string()
    .refine(validateWordCount, {
      message: 'Summary must be 80-120 words'
    })
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Summary cannot contain emojis, icons, or graphics'
    })
});

// Skills Schema
export const SkillsSchema = z.object({
  skills: z.string()
    .refine(validateCommaSeparated, {
      message: 'Skills must be in comma-separated format'
    })
});

// Experience Schema
export const ExperienceSchema = z.object({
  company: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Company cannot contain emojis, icons, or graphics'
    }),
  
  position: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Position cannot contain emojis, icons, or graphics'
    }),
  
  start_date: z.string()
    .refine(val => !val || /^[A-Z]{3} \d{4}$/.test(val), {
      message: 'Start date must be in MMM YYYY format (e.g., JAN 2020)'
    }),
  
  end_date: z.string()
    .refine(val => !val || /^[A-Z]{3} \d{4}$|^Present$/.test(val), {
      message: 'End date must be in MMM YYYY format or "Present"'
    })
    .optional(),
  
  responsibilities: z.array(z.string())
    .refine(validateMinResponsibilities, {
      message: 'Invalid responsibilities format'
    })
});

// Project Schema
export const ProjectSchema = z.object({
  name: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Project name cannot contain emojis, icons, or graphics'
    }),
  
  description: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Description cannot contain emojis, icons, or graphics'
    }),
  
  technologies: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Technologies cannot contain emojis, icons, or graphics'
    }),
  
  start_date: z.string()
    .refine(val => !val || /^[A-Z]{3} \d{4}$/.test(val), {
      message: 'Start date must be in MMM YYYY format (e.g., JAN 2020)'
    }),
  
  end_date: z.string()
    .refine(val => !val || /^[A-Z]{3} \d{4}$|^Present$/.test(val), {
      message: 'End date must be in MMM YYYY format or "Present"'
    })
    .optional()
});

// Education Schema
export const EducationSchema = z.object({
  institution: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Institution cannot contain emojis, icons, or graphics'
    }),
  
  degree: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Degree cannot contain emojis, icons, or graphics'
    }),
  
  field_of_study: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Field of study cannot contain emojis, icons, or graphics'
    }),
  
  graduation_date: z.string()
    .refine(val => !val || /^[A-Z]{3} \d{4}$/.test(val), {
      message: 'Graduation date must be in MMM YYYY format (e.g., MAY 2020)'
    }),
  
  gpa: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'GPA cannot contain emojis, icons, or graphics'
    })
    .optional()
});

// Award Schema
export const AwardSchema = z.object({
  title: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Award title cannot contain emojis, icons, or graphics'
    }),
  
  organization: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Organization cannot contain emojis, icons, or graphics'
    }),
  
  date: z.string()
    .refine(val => !val || /^[A-Z]{3} \d{4}$/.test(val), {
      message: 'Award date must be in MMM YYYY format (e.g., DEC 2020)'
    }),
  
  description: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Description cannot contain emojis, icons, or graphics'
    })
    .optional()
});

// Complete Resume Schema
export const ResumeSchema = z.object({
  header: HeaderSchema,
  expertise: ExpertiseSchema,
  skills: SkillsSchema,
  experience: z.array(ExperienceSchema),
  projects: z.array(ProjectSchema),
  education: z.array(EducationSchema),
  awards: z.array(AwardSchema).optional()
});

// Export types inferred from schemas
export type HeaderFormData = z.infer<typeof HeaderSchema>;
export type ExpertiseFormData = z.infer<typeof ExpertiseSchema>;
export type SkillsFormData = z.infer<typeof SkillsSchema>;
export type ExperienceFormData = z.infer<typeof ExperienceSchema>;
export type ProjectFormData = z.infer<typeof ProjectSchema>;
export type EducationFormData = z.infer<typeof EducationSchema>;
export type AwardFormData = z.infer<typeof AwardSchema>;
export type ResumeFormData = z.infer<typeof ResumeSchema>;