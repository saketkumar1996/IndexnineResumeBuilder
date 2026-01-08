/**
 * Zod validation schemas matching backend Pydantic models
 * Updated to match temp-ui component expectations
 * Requirements: 1.5, 5.5, 10.1, 10.2, 10.3
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
  fullName: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Name cannot contain emojis, icons, or graphics'
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
    }),

  linkedin: z.string()
    .refine(val => !val || /^https?:\/\/.+/.test(val), {
      message: 'LinkedIn must be a valid URL'
    })
    .optional(),

  github: z.string()
    .refine(val => !val || /^https?:\/\/.+/.test(val), {
      message: 'GitHub must be a valid URL'
    })
    .optional(),

  portfolio: z.string()
    .refine(val => !val || /^https?:\/\/.+/.test(val), {
      message: 'Portfolio must be a valid URL'
    })
    .optional()
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
  category: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Category cannot contain emojis, icons, or graphics'
    }),
  
  skills: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Skills cannot contain emojis, icons, or graphics'
    })
});

// Experience Schema
export const ExperienceSchema = z.object({
  company: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Company cannot contain emojis, icons, or graphics'
    }),
  
  title: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Title cannot contain emojis, icons, or graphics'
    }),

  location: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Location cannot contain emojis, icons, or graphics'
    }),
  
  startDate: z.string()
    .refine(val => !val || /^\d{2}\/\d{4}$/.test(val), {
      message: 'Start date must be in MM/YYYY format'
    }),
  
  endDate: z.string()
    .refine(val => !val || /^\d{2}\/\d{4}$|^Present$/.test(val), {
      message: 'End date must be in MM/YYYY format or "Present"'
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

  link: z.string()
    .refine(val => !val || /^https?:\/\/.+/.test(val), {
      message: 'Link must be a valid URL'
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

  location: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Location cannot contain emojis, icons, or graphics'
    }),
  
  graduationDate: z.string()
    .refine(val => !val || /^\d{2}\/\d{4}$/.test(val), {
      message: 'Graduation date must be in MM/YYYY format'
    }),
  
  gpa: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'GPA cannot contain emojis, icons, or graphics'
    })
    .optional(),

  honors: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Honors cannot contain emojis, icons, or graphics'
    })
    .optional()
});

// Award Schema
export const AwardSchema = z.object({
  title: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Award title cannot contain emojis, icons, or graphics'
    }),
  
  issuer: z.string()
    .refine(val => !val || !EMOJI_PATTERN.test(val), {
      message: 'Issuer cannot contain emojis, icons, or graphics'
    }),
  
  date: z.string()
    .refine(val => !val || /^\d{2}\/\d{4}$/.test(val), {
      message: 'Award date must be in MM/YYYY format'
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
  skills: z.array(SkillsSchema),
  experiences: z.array(ExperienceSchema),
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