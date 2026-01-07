/**
 * Frontend validation tests using Vitest and fast-check
 * Tests Zod schema validation matching backend Pydantic models
 */

import { describe, it, expect } from 'vitest';
import { fc } from 'fast-check';
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

// Custom arbitraries for property-based testing
const validEmail = fc.emailAddress();
const validPhone = fc.stringMatching(/^\+?[\d\s\-\(\)]+$/);
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
  { minLength: 80, maxLength: 120 }
).map(words => words.join(' '));

const invalidWordCountSummary = fc.oneof(
  fc.array(fc.string({ minLength: 2, maxLength: 12 }), { minLength: 1, maxLength: 79 }),
  fc.array(fc.string({ minLength: 2, maxLength: 12 }), { minLength: 121, maxLength: 200 })
).map(words => words.join(' '));

const validCommaSeparatedSkills = fc.array(
  cleanText.filter(s => !s.includes(',')),
  { minLength: 3, maxLength: 15 }
).map(skills => skills.join(', '));

const invalidSkillsNoCommas = fc.array(
  cleanText.filter(s => !s.includes(',')),
  { minLength: 2, maxLength: 10 }
).map(skills => skills.join(' '));

const validResponsibilities = fc.array(
  cleanText.filter(s => s.length >= 10),
  { minLength: 3, maxLength: 8 }
);

const invalidResponsibilities = fc.array(
  cleanText,
  { minLength: 0, maxLength: 2 }
);

describe('Header Schema Validation', () => {
  it('should accept valid header data', () => {
    fc.assert(fc.property(
      cleanText,
      cleanText,
      validEmail,
      validPhone,
      cleanText,
      (name, title, email, phone, location) => {
        const result = HeaderSchema.safeParse({
          name: name.slice(0, 100),
          title: title.slice(0, 150),
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
          name: emojiText,
          title: 'Software Engineer',
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
        name: 'John Doe',
        title: 'Software Engineer',
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
        name: 'John Doe',
        title: 'Software Engineer',
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
        // Pad to valid word count
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
    // Exactly 80 words should be valid
    const words80 = Array(80).fill('word').join(' ');
    const result80 = ExpertiseSchema.safeParse({ summary: words80 });
    expect(result80.success).toBe(true);

    // Exactly 120 words should be valid
    const words120 = Array(120).fill('word').join(' ');
    const result120 = ExpertiseSchema.safeParse({ summary: words120 });
    expect(result120.success).toBe(true);

    // 79 words should be invalid
    const words79 = Array(79).fill('word').join(' ');
    const result79 = ExpertiseSchema.safeParse({ summary: words79 });
    expect(result79.success).toBe(false);

    // 121 words should be invalid
    const words121 = Array(121).fill('word').join(' ');
    const result121 = ExpertiseSchema.safeParse({ summary: words121 });
    expect(result121.success).toBe(false);
  });
});

describe('Skills Schema Validation', () => {
  it('should accept valid comma-separated skills', () => {
    fc.assert(fc.property(
      validCommaSeparatedSkills,
      (skills) => {
        const result = SkillsSchema.safeParse({ skills });
        expect(result.success).toBe(true);
      }
    ));
  });

  it('should reject skills without commas', () => {
    fc.assert(fc.property(
      invalidSkillsNoCommas,
      (skills) => {
        const result = SkillsSchema.safeParse({ skills });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.message.toLowerCase().includes('comma')
          )).toBe(true);
        }
      }
    ));
  });

  it('should reject single skill without comma', () => {
    const result = SkillsSchema.safeParse({ skills: 'Python' });
    expect(result.success).toBe(false);
  });

  it('should accept skills with extra spaces', () => {
    const result = SkillsSchema.safeParse({ skills: 'Python , JavaScript , React' });
    expect(result.success).toBe(true);
  });
});

describe('Experience Schema Validation', () => {
  it('should accept valid experience data', () => {
    fc.assert(fc.property(
      cleanText,
      cleanText,
      validDateFormat,
      validEndDate,
      validResponsibilities,
      (company, position, startDate, endDate, responsibilities) => {
        const result = ExperienceSchema.safeParse({
          company: company.slice(0, 100),
          position: position.slice(0, 100),
          start_date: startDate,
          end_date: endDate,
          responsibilities
        });
        expect(result.success).toBe(true);
      }
    ));
  });

  it('should reject experience with insufficient responsibilities', () => {
    fc.assert(fc.property(
      invalidResponsibilities,
      (responsibilities) => {
        const result = ExperienceSchema.safeParse({
          company: 'Tech Corp',
          position: 'Developer',
          start_date: 'JAN 2020',
          end_date: 'Present',
          responsibilities
        });
        
        if (responsibilities.filter(r => r.trim()).length > 0 && 
            responsibilities.filter(r => r.trim()).length < 3) {
          expect(result.success).toBe(false);
        }
      }
    ));
  });

  it('should reject invalid date formats', () => {
    const invalidDates = ['January 2020', '01/2020', '2020-01', 'Jan 20'];
    
    invalidDates.forEach(date => {
      const result = ExperienceSchema.safeParse({
        company: 'Tech Corp',
        position: 'Developer',
        start_date: date,
        end_date: 'Present',
        responsibilities: ['Task 1', 'Task 2', 'Task 3']
      });
      expect(result.success).toBe(false);
    });
  });

  it('should accept Present as end date but not start date', () => {
    // Present should be valid for end_date
    const validResult = ExperienceSchema.safeParse({
      company: 'Tech Corp',
      position: 'Developer',
      start_date: 'JAN 2020',
      end_date: 'Present',
      responsibilities: ['Task 1', 'Task 2', 'Task 3']
    });
    expect(validResult.success).toBe(true);

    // Present should be invalid for start_date
    const invalidResult = ExperienceSchema.safeParse({
      company: 'Tech Corp',
      position: 'Developer',
      start_date: 'Present',
      end_date: 'DEC 2020',
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
      validDateFormat,
      validEndDate,
      (name, description, technologies, startDate, endDate) => {
        const result = ProjectSchema.safeParse({
          name: name.slice(0, 100),
          description: description.slice(0, 500),
          technologies,
          start_date: startDate,
          end_date: endDate
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
          start_date: 'JAN 2020',
          end_date: 'DEC 2020'
        });
        expect(result.success).toBe(false);
      }
    ));
  });
});

describe('Education Schema Validation', () => {
  it('should accept valid education data', () => {
    fc.assert(fc.property(
      cleanText,
      cleanText,
      cleanText,
      validDateFormat,
      fc.option(cleanText.filter(s => s.length <= 10)),
      (institution, degree, fieldOfStudy, graduationDate, gpa) => {
        const result = EducationSchema.safeParse({
          institution: institution.slice(0, 100),
          degree: degree.slice(0, 100),
          field_of_study: fieldOfStudy.slice(0, 100),
          graduation_date: graduationDate,
          gpa: gpa?.slice(0, 10)
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
          field_of_study: 'Computer Science',
          graduation_date: 'MAY 2020',
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
      validDateFormat,
      fc.option(cleanText.filter(s => s.length <= 200)),
      (title, organization, date, description) => {
        const result = AwardSchema.safeParse({
          title: title.slice(0, 100),
          organization: organization.slice(0, 100),
          date,
          description: description?.slice(0, 200)
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
          date: 'DEC 2020',
          description: 'Great achievement'
        });
        expect(result.success).toBe(false);
      }
    ));
  });
});

describe('Complete Resume Schema Validation', () => {
  const validCompleteResume = {
    header: {
      name: 'John Doe',
      title: 'Software Engineer',
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
    experience: [{
      company: 'Tech Corp',
      position: 'Developer',
      start_date: 'JAN 2020',
      end_date: 'Present',
      responsibilities: ['Task 1', 'Task 2', 'Task 3']
    }],
    projects: [{
      name: 'Great Project',
      description: 'A wonderful project',
      technologies: 'Python, React',
      start_date: 'JAN 2020',
      end_date: 'DEC 2020'
    }],
    education: [{
      institution: 'University',
      degree: 'Bachelor',
      field_of_study: 'Computer Science',
      graduation_date: 'MAY 2020'
    }],
    awards: []
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
      // Missing experience, projects, education
    };

    const result = ResumeSchema.safeParse(incompleteResume);
    expect(result.success).toBe(false);
  });

  it('should accept resume without optional awards section', () => {
    const resumeWithoutAwards = { ...validCompleteResume };
    delete resumeWithoutAwards.awards;

    const result = ResumeSchema.safeParse(resumeWithoutAwards);
    expect(result.success).toBe(true);
  });
});