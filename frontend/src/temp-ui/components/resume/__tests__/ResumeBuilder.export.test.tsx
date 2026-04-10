import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock heavy dependencies first
vi.mock('../ResumePDF', () => ({
  generatePDF: vi.fn(),
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock child components
vi.mock('../HeaderSection', () => ({ HeaderSection: () => null }));
vi.mock('../ExpertiseSection', () => ({ ExpertiseSection: () => null }));
vi.mock('../SkillsSection', () => ({ SkillsSection: () => null }));
vi.mock('../ExperienceSection', () => ({ ExperienceSection: () => null }));
vi.mock('../ProjectsSection', () => ({ ProjectsSection: () => null }));
vi.mock('../EducationSection', () => ({ EducationSection: () => null }));
vi.mock('../AwardsSection', () => ({ AwardsSection: () => null }));
vi.mock('../ResumePreview', () => ({ ResumePreview: () => null }));
vi.mock('../FormSection', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FormSection: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}));

// Mock react-hook-form to control trigger and formState.errors
const mockTrigger = vi.fn();
const mockErrors: Record<string, unknown> = {};

vi.mock('react-hook-form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hook-form')>();
  return {
    ...actual,
    useForm: () => ({
      watch: () => ({
        header: { fullName: 'Test User' },
        expertise: { summary: '', bulletPoints: [] },
        skills: { skills: '' },
        experiences: [],
        projects: [],
        education: [],
        awards: [],
      }),
      formState: { errors: mockErrors },
      reset: vi.fn(),
      trigger: mockTrigger,
      register: vi.fn(() => ({})),
      handleSubmit: vi.fn(),
      setValue: vi.fn(),
      getValues: vi.fn(),
      control: {},
    }),
  };
});

// Mock @/schemas/resume
vi.mock('@/schemas/resume', () => ({
  ResumeSchema: {},
}));

// Mock @hookform/resolvers/zod
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => async () => ({ values: {}, errors: {} }),
}));

// Mock @/types/resume
vi.mock('@/types/resume', () => ({
  defaultResumeData: {
    header: { fullName: '', designation: '', email: '', phone: '', location: '' },
    expertise: { summary: '', bulletPoints: [] },
    skills: { skills: '' },
    experiences: [],
    projects: [],
    education: [],
    awards: [],
  },
  sampleResumeData: {
    header: { fullName: 'Sample User', designation: 'Engineer', email: 'sample@test.com', phone: '555-0000', location: 'City' },
    expertise: { summary: 'Sample summary', bulletPoints: [] },
    skills: { skills: 'React' },
    experiences: [],
    projects: [],
    education: [],
    awards: [],
  },
}));

// Mock the SVG logo import
vi.mock('@/Black Logo.svg', () => ({ default: 'logo.svg' }));

import { generatePDF } from '../ResumePDF';
import { ResumeBuilder } from '../ResumeBuilder';

const mockGeneratePDF = generatePDF as ReturnType<typeof vi.fn>;

// Helper to render without TS type mismatch (RTL v13 / React 18 JSX.Element vs ReactElement)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderBuilder = () => render(React.createElement(ResumeBuilder as unknown as React.FC));

beforeEach(() => {
  vi.clearAllMocks();
  // Clear mockErrors object
  Object.keys(mockErrors).forEach(k => delete mockErrors[k]);
  // Default: trigger returns true (valid)
  mockTrigger.mockResolvedValue(true);
  // Default: generatePDF resolves with a blob
  mockGeneratePDF.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
});

describe('Export button state', () => {
  it('is enabled when not exporting', async () => {
    renderBuilder();
    const btn = screen.getByRole('button', { name: /export pdf/i });
    expect(btn).not.toBeDisabled();
  });
});

describe('handleExport — validation failure', () => {
  it('fires one destructive toast per errored section', async () => {
    mockTrigger.mockResolvedValue(false);
    // Simulate errors in header and skills
    mockErrors['header'] = { message: 'required' };
    mockErrors['skills'] = { message: 'required' };

    renderBuilder();
    const btn = screen.getByRole('button', { name: /export pdf/i });
    await act(async () => { fireEvent.click(btn); });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledTimes(2);
    });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'destructive',
      title: 'Contact Information has errors',
    }));
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'destructive',
      title: 'Technical Skills has errors',
    }));
  });

  it('does not call generatePDF when validation fails', async () => {
    mockTrigger.mockResolvedValue(false);
    mockErrors['header'] = { message: 'required' };

    renderBuilder();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /export pdf/i })); });

    expect(mockGeneratePDF).not.toHaveBeenCalled();
  });
});

describe('handleExport — validation success', () => {
  it('calls generatePDF when trigger returns true', async () => {
    renderBuilder();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /export pdf/i })); });

    await waitFor(() => {
      expect(mockGeneratePDF).toHaveBeenCalledTimes(1);
    });
  });

  it('shows success toast when generatePDF resolves', async () => {
    renderBuilder();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /export pdf/i })); });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Resume exported!',
      }));
    });
  });
});

describe('handleExport — PDF generation error', () => {
  it('shows destructive toast when generatePDF rejects', async () => {
    mockGeneratePDF.mockRejectedValue(new Error('PDF failed'));

    renderBuilder();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /export pdf/i })); });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: 'Export failed',
      }));
    });
  });

  it('re-enables the button after generatePDF rejects', async () => {
    mockGeneratePDF.mockRejectedValue(new Error('PDF failed'));

    renderBuilder();
    const btn = screen.getByRole('button', { name: /export pdf/i });
    await act(async () => { fireEvent.click(btn); });

    await waitFor(() => {
      expect(btn).not.toBeDisabled();
    });
  });
});

