# Requirements Document

## Introduction

The Indexnine Resume Builder is a spec-driven system that generates company-compliant resumes with zero AI assistance or dynamic formatting. The system enforces strict validation against a predefined specification, ensuring that preview and exported PDF files maintain consistent formatting. Users input structured data through a multi-section form, receive live validation feedback, and can export only when all data conforms to the specification.

## Glossary

- **Resume_Builder**: The complete system including frontend form, backend validation, and rendering components
- **Resume_Spec**: The authoritative specification defining structure, content rules, and validation requirements
- **Form_Interface**: The React-based multi-section form for data collection
- **Validation_Engine**: The Pydantic-based system that enforces spec compliance
- **Preview_Renderer**: The HTML rendering system using Jinja2 templates
- **PDF_Generator**: The ReportLab based system for final document export
- **Company_Template**: The approved PDF template defining fonts, margins, and layout

## Requirements

### Requirement 1: Structured Data Collection

**User Story:** As a user, I want to input resume data through a structured form, so that my information conforms to company standards.

#### Acceptance Criteria

1. THE Form_Interface SHALL provide exactly seven sections: Header, Expertise Summary, Skills, Experience, Project Experience, Education, and Awards
2. WHEN a user inputs data in any section, THE Form_Interface SHALL validate it against the Resume_Spec in real-time
3. THE Form_Interface SHALL prevent users from adding custom sections or modifying section order
4. WHEN validation fails, THE Form_Interface SHALL display section-specific error messages
5. THE Form_Interface SHALL use React Hook Form with Zod validation mirroring backend Pydantic models

### Requirement 2: Spec-Driven Validation

**User Story:** As a system administrator, I want all resume data validated against a strict specification, so that output is Indexnine and compliant.

#### Acceptance Criteria

1. THE Validation_Engine SHALL enforce uppercase headings for all sections
2. THE Validation_Engine SHALL require date format MMM YYYY for all date fields
3. THE Validation_Engine SHALL validate expertise summary length between 80-120 words
4. THE Validation_Engine SHALL require minimum 3 responsibilities per experience entry
5. THE Validation_Engine SHALL reject any content containing emojis, icons, or graphics
6. WHEN validation fails, THE Validation_Engine SHALL return clear, section-specific error messages
7. THE Validation_Engine SHALL block preview and export functionality until all validation passes

### Requirement 3: Live Preview Generation

**User Story:** As a user, I want to see a live preview of my resume, so that I can verify formatting before export.

#### Acceptance Criteria

1. THE Preview_Renderer SHALL generate HTML using Jinja2 templates that mirror the Company_Template layout
2. WHEN valid data is entered, THE Preview_Renderer SHALL update the preview in real-time
3. THE Preview_Renderer SHALL display the preview in an iframe to isolate styling
4. THE Preview_Renderer SHALL use identical fonts, margins, and spacing as the DOCX output
5. WHEN validation fails, THE Preview_Renderer SHALL display validation errors instead of preview content

### Requirement 4: PDF Export Generation

**User Story:** As a user, I want to export my resume as a PDF file, so that I can submit it for job applications.

#### Acceptance Criteria

1. THE PDF_Generator SHALL create output using ReportLab library with professional formatting
2. THE PDF_Generator SHALL produce output that maintains consistent formatting with the HTML preview
3. THE PDF_Generator SHALL generate ATS-friendly documents with proper structure
4. THE PDF_Generator SHALL enforce one-page output limitation
5. WHEN export is requested, THE PDF_Generator SHALL only proceed if all validation passes

### Requirement 5: Backend API Structure

**User Story:** As a frontend developer, I want a well-defined API, so that I can integrate the form with validation and rendering services.

#### Acceptance Criteria

1. THE Resume_Builder SHALL provide a FastAPI backend with Pydantic models for all resume sections
2. THE Resume_Builder SHALL expose endpoints for validation, preview generation, and PDF export
3. WHEN data is submitted, THE Resume_Builder SHALL validate using Pydantic models before processing
4. THE Resume_Builder SHALL return structured JSON responses with validation results
5. THE Resume_Builder SHALL maintain identical validation logic between frontend Zod and backend Pydantic

### Requirement 6: Content Structure Enforcement

**User Story:** As a compliance officer, I want resume structure to be non-negotiable, so that all outputs meet company standards.

#### Acceptance Criteria

1. THE Resume_Spec SHALL define exactly seven sections in fixed order: Header, Expertise Summary, Skills, Experience, Project Experience, Education, Awards
2. THE Resume_Spec SHALL require comma-separated skills format
3. THE Resume_Spec SHALL require bullet-point format for all responsibilities
4. THE Resume_Spec SHALL make Awards section optional while keeping all others mandatory
5. THE Resume_Spec SHALL prohibit any dynamic layout modifications or section reordering

### Requirement 7: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when my input doesn't meet requirements, so that I can correct issues efficiently.

#### Acceptance Criteria

1. WHEN validation fails, THE Form_Interface SHALL highlight the specific field with the error
2. THE Form_Interface SHALL display error messages that reference the specific spec violation
3. THE Form_Interface SHALL disable the export button until all validation passes
4. WHEN server errors occur, THE Form_Interface SHALL display user-friendly error messages
5. THE Form_Interface SHALL provide real-time validation feedback without requiring form submission

### Requirement 9: Sample Data and User Experience

**User Story:** As a user, I want to quickly populate the form with sample data, so that I can test the system and see a complete example.

#### Acceptance Criteria

1. THE Form_Interface SHALL provide a "Fill Sample Data" button that populates all form sections
2. THE sample data SHALL comply with all validation rules and pass spec validation
3. THE sample data SHALL demonstrate proper formatting for all field types including dates, word counts, and responsibilities
4. WHEN sample data is filled, THE Form_Interface SHALL immediately enable preview and export functionality
5. THE sample data SHALL include realistic professional content suitable for demonstration purposes

### Requirement 8: Template Compliance and Rendering Pipeline

**User Story:** As a system architect, I want a Indexnine rendering pipeline, so that preview and export outputs are identical.

#### Acceptance Criteria

1. THE Resume_Builder SHALL follow the pipeline: Form Input → Spec Validation → Pydantic Validation → HTML Rendering → Preview Display → PDF Generation
2. THE Preview_Renderer SHALL use the same data structure as the PDF_Generator
3. THE Resume_Builder SHALL maintain structural alignment between HTML and PDF outputs
4. THE Resume_Builder SHALL use the Company_Template as the single source of truth for formatting
5. WHEN rendering occurs, THE Resume_Builder SHALL apply no dynamic formatting or layout adjustments

### Requirement 10: UI Refactor and Design Migration

**User Story:** As a user, I want an improved visual interface that maintains all existing functionality, so that I can build resumes with a better user experience while preserving all validation and export capabilities.

#### Acceptance Criteria

1. THE Form_Interface SHALL migrate to the visual components found in src/temp-ui/ while preserving all existing functional logic
2. THE Form_Interface SHALL maintain identical state management, validation logic, and API integration from the existing src/components/
3. THE Form_Interface SHALL preserve all React Hook Form integration, Zod validation, and real-time validation feedback
4. THE Form_Interface SHALL maintain the same seven-section structure with collapsible/expandable section behavior
5. THE Form_Interface SHALL preserve the "Fill Sample Data" functionality and export capabilities
6. THE Form_Interface SHALL maintain identical backend API integration for validation, preview, and PDF export
7. THE Form_Interface SHALL preserve all error handling, user feedback mechanisms, and validation state management
8. THE Form_Interface SHALL use the new visual design components while maintaining functional compatibility with existing tests