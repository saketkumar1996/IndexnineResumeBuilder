/**
 * Frontend API integration tests
 * Tests API communication, error handling, and data flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ValidationResponse, PreviewResponse } from '../types/resume';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions (these would typically be in a separate API module)
const validateResume = async (resumeData: any): Promise<ValidationResponse> => {
  const response = await fetch('/api/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resumeData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

const generatePreview = async (resumeData: any): Promise<PreviewResponse> => {
  const response = await fetch('/api/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resumeData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

const exportResume = async (resumeData: any): Promise<Blob> => {
  const response = await fetch('/api/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resumeData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.blob();
};

describe('API Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validResumeData = {
    header: {
      name: 'John Doe',
      title: 'Software Engineer',
      email: 'john@example.com',
      phone: '+1 555-123-4567',
      location: 'San Francisco, CA'
    },
    expertise: {
      summary: 'Experienced software engineer with over 5 years of experience in full-stack development. Proficient in Python, JavaScript, and cloud technologies. Strong background in building scalable web applications and microservices. Passionate about clean code, test-driven development, and agile methodologies. Proven track record of delivering high-quality software solutions on time and within budget. Excellent communication skills and ability to work effectively in cross-functional teams. Committed to continuous learning and staying updated with the latest industry trends and best practices.'
    },
    skills: {
      skills: 'Python, JavaScript, React, Node.js, AWS, Docker'
    },
    experience: [{
      company: 'Tech Corp',
      position: 'Senior Developer',
      start_date: 'JAN 2020',
      end_date: 'Present',
      responsibilities: [
        'Led development of microservices architecture',
        'Mentored junior developers and conducted code reviews',
        'Implemented CI/CD pipelines using Jenkins and Docker'
      ]
    }],
    projects: [{
      name: 'E-commerce Platform',
      description: 'Built scalable e-commerce platform serving 10k+ users',
      technologies: 'React, Node.js, PostgreSQL, AWS',
      start_date: 'MAR 2021',
      end_date: 'DEC 2021'
    }],
    education: [{
      institution: 'University of California',
      degree: 'Bachelor of Science',
      field_of_study: 'Computer Science',
      graduation_date: 'MAY 2018',
      gpa: '3.8'
    }],
    awards: []
  };

  const invalidResumeData = {
    header: {
      name: 'John Doe 🎉', // Contains emoji
      title: 'Software Engineer',
      email: 'invalid-email', // Invalid format
      phone: '+1 555-123-4567',
      location: 'San Francisco, CA'
    },
    expertise: {
      summary: 'Too short' // < 80 words
    },
    skills: {
      skills: 'Python JavaScript React' // No commas
    },
    experience: [{
      company: 'Tech Corp',
      position: 'Developer',
      start_date: 'January 2020', // Invalid date format
      end_date: 'Present',
      responsibilities: ['Only one task'] // < 3 responsibilities
    }],
    projects: [], // Empty required section
    education: [] // Empty required section
  };

  describe('Validation API', () => {
    it('should validate correct resume data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          errors: null,
          data: validResumeData
        })
      });

      const result = await validateResume(validResumeData);

      expect(mockFetch).toHaveBeenCalledWith('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validResumeData)
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('should return validation errors for invalid data', async () => {
      const expectedErrors = [
        {
          field: 'header.name',
          message: 'Name cannot contain emojis, icons, or graphics',
          type: 'value_error',
          spec_reference: 'Requirements 2.5'
        },
        {
          field: 'header.email',
          message: 'Invalid email format',
          type: 'value_error'
        },
        {
          field: 'expertise.summary',
          message: 'Summary must be 80-120 words, got 2',
          type: 'value_error',
          spec_reference: 'Requirements 2.3'
        },
        {
          field: 'skills.skills',
          message: 'Skills must be in comma-separated format',
          type: 'value_error',
          spec_reference: 'Requirements 6.2'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: false,
          errors: expectedErrors,
          data: null
        })
      });

      const result = await validateResume(invalidResumeData);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors![0].field).toBe('header.name');
      expect(result.errors![0].message).toContain('emoji');
      expect(result.errors![0].spec_reference).toBe('Requirements 2.5');
      expect(result.data).toBeNull();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(validateResume(validResumeData)).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' })
      });

      await expect(validateResume(validResumeData)).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('Preview API', () => {
    it('should generate HTML preview for valid data', async () => {
      const expectedHtml = '<div class="resume"><h1>John Doe</h1><p>Software Engineer</p></div>';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          html: expectedHtml,
          valid: true,
          errors: null
        })
      });

      const result = await generatePreview(validResumeData);

      expect(mockFetch).toHaveBeenCalledWith('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validResumeData)
      });

      expect(result.html).toBe(expectedHtml);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should return error preview for invalid data', async () => {
      const errorHtml = '<div class="error">Validation errors prevent preview generation</div>';
      const expectedErrors = [
        {
          field: 'header.email',
          message: 'Invalid email format',
          type: 'value_error'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          html: errorHtml,
          valid: false,
          errors: expectedErrors
        })
      });

      const result = await generatePreview(invalidResumeData);

      expect(result.html).toContain('error');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle preview generation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Error generating preview' })
      });

      await expect(generatePreview(validResumeData)).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('Export API', () => {
    it('should export DOCX for valid data', async () => {
      const mockBlob = new Blob(['fake docx content'], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });

      const result = await exportResume(validResumeData);

      expect(mockFetch).toHaveBeenCalledWith('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validResumeData)
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('should block export for invalid data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          detail: {
            message: 'Validation failed - export blocked',
            errors: [
              {
                field: 'header.email',
                message: 'Invalid email format'
              }
            ]
          }
        })
      });

      await expect(exportResume(invalidResumeData)).rejects.toThrow('HTTP error! status: 422');
    });

    it('should handle export generation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Error generating DOCX export' })
      });

      await expect(exportResume(validResumeData)).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('Error Response Handling', () => {
    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await expect(validateResume(validResumeData)).rejects.toThrow('Invalid JSON');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(validateResume(validResumeData)).rejects.toThrow('Request timeout');
    });

    it('should handle CORS errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(validateResume(validResumeData)).rejects.toThrow('Failed to fetch');
    });
  });

  describe('Request Payload Validation', () => {
    it('should send correct headers for all requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ valid: true, errors: null, data: {} })
      });

      await validateResume(validResumeData);
      await generatePreview(validResumeData);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      mockFetch.mock.calls.forEach(call => {
        expect(call[1].headers['Content-Type']).toBe('application/json');
        expect(call[1].method).toBe('POST');
      });
    });

    it('should serialize resume data correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, errors: null, data: {} })
      });

      await validateResume(validResumeData);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.header.name).toBe('John Doe');
      expect(requestBody.experience).toHaveLength(1);
      expect(requestBody.experience[0].responsibilities).toHaveLength(3);
    });

    it('should handle special characters in request data', async () => {
      const dataWithSpecialChars = {
        ...validResumeData,
        header: {
          ...validResumeData.header,
          name: 'José María O\'Connor-Smith'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, errors: null, data: {} })
      });

      await validateResume(dataWithSpecialChars);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.header.name).toBe('José María O\'Connor-Smith');
    });
  });

  describe('Response Data Validation', () => {
    it('should validate ValidationResponse structure', async () => {
      const mockResponse = {
        valid: true,
        errors: null,
        data: validResumeData
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await validateResume(validResumeData);

      expect(typeof result.valid).toBe('boolean');
      expect(result.errors).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('should validate PreviewResponse structure', async () => {
      const mockResponse = {
        html: '<div>Preview content</div>',
        valid: true,
        errors: null
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await generatePreview(validResumeData);

      expect(typeof result.html).toBe('string');
      expect(typeof result.valid).toBe('boolean');
      expect(result.errors).toBeNull();
    });

    it('should validate error response structure', async () => {
      const mockErrorResponse = {
        valid: false,
        errors: [
          {
            field: 'header.email',
            message: 'Invalid email format',
            type: 'value_error',
            spec_reference: 'Requirements 2.1'
          }
        ],
        data: null
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorResponse
      });

      const result = await validateResume(invalidResumeData);

      expect(result.valid).toBe(false);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors![0]).toHaveProperty('field');
      expect(result.errors![0]).toHaveProperty('message');
      expect(result.errors![0]).toHaveProperty('type');
      expect(result.data).toBeNull();
    });
  });
});