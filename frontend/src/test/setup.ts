/**
 * Test setup configuration for Vitest
 * Configures testing environment, mocks, and global utilities
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock URL.createObjectURL for file download tests
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock HTMLElement.scrollIntoView
HTMLElement.prototype.scrollIntoView = vi.fn();

// Global test utilities
export const createMockResumeData = () => ({
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
});

export const createMockValidationResponse = (valid: boolean = true) => ({
  valid,
  errors: valid ? null : [
    {
      field: 'header.email',
      message: 'Invalid email format',
      type: 'value_error'
    }
  ],
  data: valid ? createMockResumeData() : null
});

export const createMockPreviewResponse = (valid: boolean = true) => ({
  html: valid ? '<div>Preview content</div>' : '<div class="error">Validation errors</div>',
  valid,
  errors: valid ? null : [
    {
      field: 'header.email',
      message: 'Invalid email format',
      type: 'value_error'
    }
  ]
});