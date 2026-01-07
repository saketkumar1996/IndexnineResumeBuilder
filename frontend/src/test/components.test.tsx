/**
 * Frontend component tests using Vitest and Testing Library
 * Tests React components, form validation, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResumeForm } from '../components/ResumeForm';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ResumeForm Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should render all form sections', () => {
    render(<ResumeForm />);
    
    // Check for main sections
    expect(screen.getByText(/header/i)).toBeInTheDocument();
    expect(screen.getByText(/expertise/i)).toBeInTheDocument();
    expect(screen.getByText(/skills/i)).toBeInTheDocument();
    expect(screen.getByText(/experience/i)).toBeInTheDocument();
    expect(screen.getByText(/projects/i)).toBeInTheDocument();
    expect(screen.getByText(/education/i)).toBeInTheDocument();
    expect(screen.getByText(/awards/i)).toBeInTheDocument();
  });

  it('should show validation errors for invalid email', async () => {
    const user = userEvent.setup();
    render(<ResumeForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur event
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('should show validation errors for invalid phone', async () => {
    const user = userEvent.setup();
    render(<ResumeForm />);
    
    const phoneInput = screen.getByLabelText(/phone/i);
    await user.type(phoneInput, 'invalid-phone');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/invalid phone format/i)).toBeInTheDocument();
    });
  });

  it('should validate expertise summary word count', async () => {
    const user = userEvent.setup();
    render(<ResumeForm />);
    
    const summaryTextarea = screen.getByLabelText(/summary/i);
    await user.type(summaryTextarea, 'Too short summary');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/must be 80-120 words/i)).toBeInTheDocument();
    });
  });

  it('should validate skills comma-separated format', async () => {
    const user = userEvent.setup();
    render(<ResumeForm />);
    
    const skillsInput = screen.getByLabelText(/skills/i);
    await user.type(skillsInput, 'Python JavaScript React');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/comma-separated format/i)).toBeInTheDocument();
    });
  });

  it('should validate minimum responsibilities count', async () => {
    const user = userEvent.setup();
    render(<ResumeForm />);
    
    // Add experience entry
    const addExperienceButton = screen.getByText(/add experience/i);
    await user.click(addExperienceButton);
    
    // Fill required fields
    const companyInput = screen.getByLabelText(/company/i);
    const positionInput = screen.getByLabelText(/position/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    
    await user.type(companyInput, 'Tech Corp');
    await user.type(positionInput, 'Developer');
    await user.type(startDateInput, 'JAN 2020');
    
    // Add only one responsibility
    const addResponsibilityButton = screen.getByText(/add responsibility/i);
    await user.click(addResponsibilityButton);
    
    const responsibilityInput = screen.getByLabelText(/responsibility/i);
    await user.type(responsibilityInput, 'Only one task');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/minimum 3 responsibilities/i)).toBeInTheDocument();
    });
  });

  it('should validate date format', async () => {
    const user = userEvent.setup();
    render(<ResumeForm />);
    
    // Add experience entry
    const addExperienceButton = screen.getByText(/add experience/i);
    await user.click(addExperienceButton);
    
    const startDateInput = screen.getByLabelText(/start date/i);
    await user.type(startDateInput, 'January 2020');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/MMM YYYY format/i)).toBeInTheDocument();
    });
  });

  it('should reject emojis in text fields', async () => {
    const user = userEvent.setup();
    render(<ResumeForm />);
    
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'John Doe 🎉');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/cannot contain emojis/i)).toBeInTheDocument();
    });
  });

  it('should allow Present as end date', async () => {
    const user = userEvent.setup();
    render(<ResumeForm />);
    
    // Add experience entry
    const addExperienceButton = screen.getByText(/add experience/i);
    await user.click(addExperienceButton);
    
    const endDateInput = screen.getByLabelText(/end date/i);
    await user.type(endDateInput, 'Present');
    await user.tab();
    
    // Should not show validation error
    await waitFor(() => {
      expect(screen.queryByText(/invalid.*date/i)).not.toBeInTheDocument();
    });
  });

  it('should call validation API on form submission', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        errors: null,
        data: {}
      })
    });
    
    render(<ResumeForm />);
    
    // Fill out minimal valid form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/title/i), 'Software Engineer');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1 555-123-4567');
    await user.type(screen.getByLabelText(/location/i), 'San Francisco, CA');
    
    // Fill expertise with valid word count
    const validSummary = Array(90).fill('word').join(' ');
    await user.type(screen.getByLabelText(/summary/i), validSummary);
    
    await user.type(screen.getByLabelText(/skills/i), 'Python, JavaScript, React');
    
    // Submit form
    const submitButton = screen.getByText(/validate/i);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('John Doe')
      });
    });
  });

  it('should display API validation errors', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: false,
        errors: [
          {
            field: 'header.email',
            message: 'Invalid email format',
            type: 'value_error'
          },
          {
            field: 'expertise.summary',
            message: 'Summary must be 80-120 words, got 5',
            type: 'value_error'
          }
        ],
        data: null
      })
    });
    
    render(<ResumeForm />);
    
    const submitButton = screen.getByText(/validate/i);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      expect(screen.getByText(/must be 80-120 words/i)).toBeInTheDocument();
    });
  });

  it('should generate preview for valid data', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        html: '<div>Preview HTML content</div>',
        errors: null
      })
    });
    
    render(<ResumeForm />);
    
    const previewButton = screen.getByText(/preview/i);
    await user.click(previewButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/preview', expect.any(Object));
    });
  });

  it('should handle export functionality', async () => {
    const user = userEvent.setup();
    
    // Mock successful export
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(['fake docx content'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
    });
    
    // Mock URL.createObjectURL
    const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.createObjectURL = mockCreateObjectURL;
    
    render(<ResumeForm />);
    
    const exportButton = screen.getByText(/export/i);
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/export', expect.any(Object));
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  it('should handle dynamic form sections', async () => {
    const user = userEvent.setup();
    render(<ResumeForm />);
    
    // Test adding experience entries
    const addExperienceButton = screen.getByText(/add experience/i);
    await user.click(addExperienceButton);
    
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/position/i)).toBeInTheDocument();
    
    // Test removing experience entries
    const removeExperienceButton = screen.getByText(/remove/i);
    await user.click(removeExperienceButton);
    
    expect(screen.queryByLabelText(/company/i)).not.toBeInTheDocument();
  });

  it('should handle real-time validation during typing', async () => {
    const user = userEvent.setup();
    render(<ResumeForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    
    // Type invalid email
    await user.type(emailInput, 'invalid');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
    
    // Clear and type valid email
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@example.com');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
    });
  });

  it('should preserve form data during validation', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: false,
        errors: [{ field: 'skills.skills', message: 'Must be comma-separated' }],
        data: null
      })
    });
    
    render(<ResumeForm />);
    
    // Fill form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/skills/i), 'Python JavaScript');
    
    // Submit and get validation error
    const submitButton = screen.getByText(/validate/i);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/comma-separated/i)).toBeInTheDocument();
    });
    
    // Verify form data is preserved
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Python JavaScript')).toBeInTheDocument();
  });

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup();
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<ResumeForm />);
    
    const submitButton = screen.getByText(/validate/i);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});