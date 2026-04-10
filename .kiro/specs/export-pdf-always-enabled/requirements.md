# Requirements Document

## Introduction

This feature modifies the Export PDF button behavior in the Indexnine Resume Builder. Currently, the button is disabled until all form validation passes. The new behavior keeps the button always enabled and moves validation to the click handler, surfacing errors as toast notifications instead of silently blocking the user.

## Glossary

- **Export_Button**: The "Export PDF" button rendered in the `ResumeBuilder` header and mobile toolbar.
- **Validator**: The client-side validation layer powered by React Hook Form and Zod schemas.
- **Toast_System**: The `useToast` hook and `Toaster` component used to display non-blocking notifications.
- **PDF_Generator**: The `generatePDF` function in `ResumePDF.tsx` responsible for producing the downloadable PDF blob.
- **Resume_Form**: The complete multi-section form managed by React Hook Form in `ResumeBuilder.tsx`.
- **Validation_Error**: A field-level or section-level error produced by the Zod schema resolver.
- **Section**: A named grouping of related form fields (e.g., Contact Information, Work Experience, Education).

---

## Requirements

### Requirement 1: Export Button Always Enabled

**User Story:** As a resume builder user, I want the Export PDF button to always be clickable, so that I can attempt an export at any point and receive clear feedback about what needs to be fixed.

#### Acceptance Criteria

1. THE Export_Button SHALL be rendered in an enabled state at all times, regardless of Resume_Form validation state.
2. THE Export_Button SHALL be rendered in an enabled state at all times, regardless of whether all required fields are filled.
3. WHILE the PDF_Generator is running, THE Export_Button SHALL display the label "Exporting..." and SHALL be disabled to prevent duplicate submissions.
4. THE Export_Button SHALL apply active styling (accent background) at all times when not in the exporting state, replacing the current disabled/muted styling.

---

### Requirement 2: Validation on Click

**User Story:** As a resume builder user, I want the form to be fully validated when I click Export PDF, so that I receive immediate and complete feedback about any issues before a PDF is generated.

#### Acceptance Criteria

1. WHEN the Export_Button is clicked, THE Validator SHALL trigger validation across all Resume_Form fields.
2. WHEN the Export_Button is clicked, THE Validator SHALL reuse the existing Zod schema (`ResumeSchema`) without introducing duplicate validation logic.
3. WHEN the Export_Button is clicked and validation completes, THE Resume_Form SHALL determine the overall validity result before proceeding.

---

### Requirement 3: Error Notification on Validation Failure

**User Story:** As a resume builder user, I want to see clear toast notifications listing what needs to be fixed, so that I can correct my resume without guessing which fields are incomplete.

#### Acceptance Criteria

1. WHEN the Export_Button is clicked and one or more Validation_Errors exist, THE Toast_System SHALL display at least one toast notification with `variant: "destructive"`.
2. WHEN the Export_Button is clicked and Validation_Errors exist, THE Toast_System SHALL display a notification identifying each Section that contains errors (e.g., "Contact Information has errors", "Work Experience has errors").
3. WHEN the Export_Button is clicked and Validation_Errors exist, THE PDF_Generator SHALL NOT be invoked.
4. IF the Validator produces Validation_Errors for multiple Sections, THEN THE Toast_System SHALL display one toast per Section with errors, each identifying the Section by name.
5. THE Toast_System SHALL display notifications in a non-blocking manner that does not prevent the user from continuing to edit the Resume_Form.

---

### Requirement 4: PDF Generation on Validation Success

**User Story:** As a resume builder user, I want the PDF to be automatically generated and downloaded when all validations pass, so that I get my resume without any extra steps.

#### Acceptance Criteria

1. WHEN the Export_Button is clicked and all Resume_Form fields pass validation, THE PDF_Generator SHALL be invoked with the current form data.
2. WHEN the PDF_Generator completes successfully, THE Resume_Form SHALL trigger an automatic file download of the generated PDF.
3. WHEN the PDF_Generator completes successfully, THE Toast_System SHALL display a success notification confirming the download.
4. IF the PDF_Generator throws an error, THEN THE Toast_System SHALL display a destructive toast notification describing the failure.
5. IF the PDF_Generator throws an error, THEN THE Resume_Form SHALL return to an interactive state with the Export_Button re-enabled.

---

### Requirement 5: No Redundant Validation Logic

**User Story:** As a developer maintaining this codebase, I want validation to remain centralized in the existing Zod schema, so that there is no duplicated or divergent validation logic.

#### Acceptance Criteria

1. THE Validator SHALL derive all field-level validation rules exclusively from `ResumeSchema` defined in `frontend/src/schemas/resume.ts`.
2. THE Export_Button click handler SHALL NOT reimplement field-level checks that are already covered by `ResumeSchema` (e.g., the `isAllDataFilled` helper function SHALL be removed from the export gate).
3. THE PDF_Generator SHALL remain decoupled from the Validator; the export handler SHALL call validation first and only invoke the PDF_Generator upon a passing result.
