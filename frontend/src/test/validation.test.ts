/**
 * Frontend validation tests using Vitest and fast-check
 * Tests the Zod schemas that enforce the resume content rules
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  HeaderSchema,
  ExpertiseSchema,
  SkillsSchema,
  ExperienceSchema,
  ProjectSchema,
  EducationSchema,
  AwardSchema,
  ResumeSchema
} from '../schemas/resume';

const validEmail = fc.emailAddress().filter((email) => /^[^@]+@[^@]+\.[^@]+$/.test(email));
const validPhone = fc.stringMatching(/^\+?[\d\s\-\(\)]+$/).filter((phone) => phone.trim().length > 0);
const validYear = fc.integer({ min: 1980, max: 2030 }).map(String);
const validDateFormat = fc.constantFrom(
  'JAN 2020', 'FEB 2021', 'MAR 2022', 'APR 2023', 'MAY 2024',
  'JUN 2019', 'JUL 2020', 'AUG 2021', 'SEP 2022', 'OCT 2023',
  'NOV 2024', 'DEC 2025'
);
const validEndDate = fc.oneof(validDateFormat, fc.constant('Present'));

const cleanText = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0 && !/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}]/u.test(s));

const textWithEmojis = fc.string({ minLength: 5, maxLength: 50 })
  .map(s => s + fc.sample(fc.constantFrom('🎉', '😀', '💻', '📱', '🚀'), 1)[0]);

const validWordCountSummary = fc.array(
  fc.string({ minLength: 2, maxLength: 12 }).filter(s => s.trim().length > 0),
  { minLength: 50, maxLength: 200 }
).map(words => words.join(' '));

const invalidWordCountSummary = fc.oneof(
  fc.array(fc.string({ minLength: 2, maxLength: 12 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 49 }),
  fc.array(fc.string({ minLength: 2, maxLength: 12 }).filter(s => s.trim().length > 0), { minLength: 201, maxLength: 280 })
).map(words => words.join(' '));

const validCommaSeparatedSkills = fc.array(
  cleanText.filter(s => !s.includes(',')),
  { minLength: 1, maxLength: 15 }
).map(skills => skills.join(', '));

const validResponsibilities = fc.array(
  cleanText.filter(s => s.length >= 10),
  { minLength: 0, maxLength: 3 }
);

const excessiveResponsibilities = fc.array(
  cleanText.filter(s => s.length >= 10),
  { minLength: 4, maxLength: 8 }
);

describe('Header Schema Validation', () => {
  it('should accept valid header data', () => {
    fc.assert(fc.property(
      cleanText,
      cleanText,
      validEmail,
      validPhone,
      cleanText,
      (fullName, designation, email, phone, location) => {
        const result = HeaderSchema.safeParse({
          fullName: fullName.slice(0, 100),
          designation: designation.slice(0, 100),
          email,
          phone,
          location: location.slice(0, 100)
        });
        expect(result.success).toBe(true);
      }
    ));
  });

  it('should reject header data with emojis', () => {
    fc.assert(fc.property(
      textWithEmojis,
      (emojiText) => {
        const result = HeaderSchema.safeParse({
          fullName: emojiText,
          designation: 'Software Engineer',
          email: 'test@example.com',
          phone: '+1 555-123-4567',
          location: 'San Francisco, CA'
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue =>
            issue.message.toLowerCase().includes('emoji') ||
            issue.message.toLowerCase().includes('icon') ||
            issue.message.toLowerCase().includes('graphic')
          )).toBe(true);
        }
      }
    ));
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = ['invalid-email', 'test@', '@example.com', 'test.example.com'];

    invalidEmails.forEach(email => {
      const result = HeaderSchema.safeParse({
        fullName: 'John Doe',
        designation: 'Software Engineer',
        email,
        phone: '+1 555-123-4567',
        location: 'San Francisco, CA'
      });
      expect(result.success).toBe(false);
    });
  });

  it('should reject invalid phone formats', () => {
    const invalidPhones = ['abc', '123abc', 'phone-number'];

    invalidPhones.forEach(phone => {
      const result = HeaderSchema.safeParse({
        fullName: 'John Doe',
        designation: 'Software Engineer',
        email: 'test@example.com',
        phone,
        location: 'San Francisco, CA'
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Expertise Schema Validation', () => {
  it('should accept valid word count summaries', () => {
    fc.assert(fc.property(
      validWordCountSummary,
      (summary) => {
        const result = ExpertiseSchema.safeParse({ summary });
        expect(result.success).toBe(true);
      }
    ));
  });

  it('should reject invalid word count summaries', () => {
    fc.assert(fc.property(
      invalidWordCountSummary,
      (summary) => {
        const result = ExpertiseSchema.safeParse({ summary });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue =>
            issue.message.toLowerCase().includes('word')
          )).toBe(true);
        }
      }
    ));
  });

  it('should reject summaries with emojis', () => {
    fc.assert(fc.property(
      textWithEmojis,
      (emojiText) => {
        const words = emojiText.split(' ');
        const paddedWords = [...words, ...Array(85).fill('word')];
        const summary = paddedWords.slice(0, 100).join(' ');

        const result = ExpertiseSchema.safeParse({ summary });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue =>
            issue.message.toLowerCase().includes('emoji') ||
            issue.message.toLowerCase().includes('icon') ||
            issue.message.toLowerCase().includes('graphic')
          )).toBe(true);
        }
      }
    ));
  });

  it('should validate exact word count boundaries', () => {
    const words50 = Array(50).fill('word').join(' ');
    expect(ExpertiseSchema.safeParse({ summary: words50 }).success).toBe(true);

    const words200 = Array(200).fill('word').join(' ');
    expect(ExpertiseSchema.safeParse({ summary: words200 }).success).toBe(true);

    const words49 = Array(49).fill('word').join(' ');
    expect(ExpertiseSchema.safeParse({ summary: words49 }).success).toBe(false);

    const words201 = Array(201).fill('word').join(' ');
    expect(ExpertiseSchema.safeParse({ summary: words201 }).success).toBe(false);
  });
});

describe('Skills Schema Validation', () => {
  it('should accept comma-separated skills', () => {
    fc.assert(fc.property(
      validCommaSeparatedSkills,
      (skills) => {
        const result = SkillsSchema.safeParse({ skills });
        expect(result.success).toBe(true);
      }
    ));
  });

  it('should accept a single skill', () => {
    const result = SkillsSchema.safeParse({ skills: 'Python' });
    expect(result.success).toBe(true);
  });

  it('should accept skills with extra spaces', () => {
    const result = SkillsSchema.safeParse({ skills: 'Python , JavaScript , React' });
    expect(result.success).toBe(true);
  });

  it('should reject skills with emojis', () => {
    const result = SkillsSchema.safeParse({ skills: 'Python, JavaScript 🚀' });
    expect(result.success).toBe(false);
  });
});

describe('Experience Schema Validation', () => {
  it('should accept valid experience data', () => {
    fc.assert(fc.property(
      cleanText,
      cleanText,
      cleanText,
      validDateFormat,
      validEndDate,
      validResponsibilities,
      (company, title, location, startDate, endDate, responsibilities) => {
        const result = ExperienceSchema.safeParse({
          company: company.slice(0, 100),
          title: title.slice(0, 100),
          location: location.slice(0, 100),
          startDate,
          endDate,
          responsibilities
        });
        expect(result.success).toBe(true);
      }
    ));
  });

  it('should reject experience with more than three responsibilities', () => {
    fc.assert(fc.property(
      excessiveResponsibilities,
      (responsibilities) => {
        const result = ExperienceSchema.safeParse({
          company: 'Tech Corp',
          title: 'Developer',
          location: 'San Francisco, CA',
          startDate: 'JAN 2020',
          endDate: 'Present',
          responsibilities
        });

        expect(result.success).toBe(false);
      }
    ));
  });

  it('should reject invalid date formats', () => {
    const invalidDates = ['January 2020', '01/2020', '2020-01', 'Jan 20'];

    invalidDates.forEach(date => {
      const result = ExperienceSchema.safeParse({
        company: 'Tech Corp',
        title: 'Developer',
        location: 'San Francisco, CA',
        startDate: date,
        endDate: 'Present',
        responsibilities: ['Task 1', 'Task 2', 'Task 3']
      });
      expect(result.success).toBe(false);
    });
  });

  it('should accept Present as end date but not start date', () => {
    const validResult = ExperienceSchema.safeParse({
      company: 'Tech Corp',
      title: 'Developer',
      location: 'San Francisco, CA',
      startDate: 'JAN 2020',
      endDate: 'Present',
      responsibilities: ['Task 1', 'Task 2', 'Task 3']
    });
    expect(validResult.success).toBe(true);

    const invalidResult = ExperienceSchema.safeParse({
      company: 'Tech Corp',
      title: 'Developer',
      location: 'San Francisco, CA',
      startDate: 'Present',
      endDate: 'DEC 2020',
      responsibilities: ['Task 1', 'Task 2', 'Task 3']
    });
    expect(invalidResult.success).toBe(false);
  });
});

describe('Project Schema Validation', () => {
  it('should accept valid project data', () => {
    fc.assert(fc.property(
      cleanText,
      cleanText,
      cleanText,
      (name, description, technologies) => {
        const result = ProjectSchema.safeParse({
          name: name.slice(0, 100),
          description: description.slice(0, 500),
          technologies,
          link: 'https://example.com'
        });
        expect(result.success).toBe(true);
      }
    ));
  });

  it('should reject project data with emojis', () => {
    fc.assert(fc.property(
      textWithEmojis,
      (emojiText) => {
        const result = ProjectSchema.safeParse({
          name: emojiText,
          description: 'A great project',
          technologies: 'Python, React',
          link: 'https://example.com'
        });
        expect(result.success).toBe(false);
      }
    ));
  });

  it('should reject project data with more than two responsibilities', () => {
    const result = ProjectSchema.safeParse({
      name: 'Selected Project',
      description: 'A great project',
      technologies: 'Python, React',
      responsibilities: ['Task 1', 'Task 2', 'Task 3']
    });

    expect(result.success).toBe(false);
  });
});

describe('Education Schema Validation', () => {
  it('should accept valid education data', () => {
    fc.assert(fc.property(
      cleanText,
      cleanText,
      cleanText,
      validYear,
      validYear,
      fc.option(cleanText.filter(s => s.length <= 10)),
      fc.option(cleanText.filter(s => s.length <= 100)),
      (institution, degree, location, startYear, endYear, gpa, honors) => {
        const result = EducationSchema.safeParse({
          institution: institution.slice(0, 100),
          degree: degree.slice(0, 100),
          location: location.slice(0, 100),
          startYear,
          endYear,
          gpa: gpa?.slice(0, 10),
          honors: honors?.slice(0, 100)
        });
        expect(result.success).toBe(true);
      }
    ));
  });

  it('should reject education data with emojis', () => {
    fc.assert(fc.property(
      textWithEmojis,
      (emojiText) => {
        const result = EducationSchema.safeParse({
          institution: emojiText,
          degree: 'Bachelor of Science',
          location: 'Berkeley, CA',
          startYear: '2016',
          endYear: '2020',
          gpa: '3.8'
        });
        expect(result.success).toBe(false);
      }
    ));
  });
});

describe('Award Schema Validation', () => {
  it('should accept valid award data', () => {
    fc.assert(fc.property(
      cleanText,
      cleanText,
      validYear,
      (title, organization, year) => {
        const result = AwardSchema.safeParse({
          title: title.slice(0, 100),
          organization: organization.slice(0, 100),
          year
        });
        expect(result.success).toBe(true);
      }
    ));
  });

  it('should reject award data with emojis', () => {
    fc.assert(fc.property(
      textWithEmojis,
      (emojiText) => {
        const result = AwardSchema.safeParse({
          title: emojiText,
          organization: 'Tech Awards',
          year: '2020'
        });
        expect(result.success).toBe(false);
      }
    ));
  });
});

describe('Complete Resume Schema Validation', () => {
  const validCompleteResume = {
    header: {
      fullName: 'John Doe',
      designation: 'Software Engineer',
      email: 'john@example.com',
      phone: '+1 555-123-4567',
      location: 'San Francisco, CA'
    },
    expertise: {
      summary: Array(90).fill('word').join(' ')
    },
    skills: {
      skills: 'Python, JavaScript, React, Node.js'
    },
    experiences: [{
      company: 'Tech Corp',
      title: 'Developer',
      location: 'San Francisco, CA',
      startDate: 'JAN 2020',
      endDate: 'Present',
      responsibilities: ['Task 1', 'Task 2', 'Task 3']
    }],
    projects: [{
      name: 'Great Project',
      description: 'A wonderful project',
      technologies: 'Python, React',
      link: 'https://example.com'
    }],
    education: [{
      institution: 'University',
      degree: 'Bachelor',
      location: 'Berkeley, CA',
      startYear: '2016',
      endYear: '2020'
    }],
    awards: [] as { title: string; year: string; organization: string }[]
  };

  it('should accept complete valid resume', () => {
    const result = ResumeSchema.safeParse(validCompleteResume);
    expect(result.success).toBe(true);
  });

  it('should reject resume with missing required sections', () => {
    const incompleteResume = {
      header: validCompleteResume.header,
      expertise: validCompleteResume.expertise,
      skills: validCompleteResume.skills
    };

    const result = ResumeSchema.safeParse(incompleteResume);
    expect(result.success).toBe(false);
  });

  it('should accept resume without optional awards section', () => {
    const { awards: _awards, ...resumeWithoutAwards } = validCompleteResume;
    const result = ResumeSchema.safeParse(resumeWithoutAwards);
    expect(result.success).toBe(true);
  });
});
