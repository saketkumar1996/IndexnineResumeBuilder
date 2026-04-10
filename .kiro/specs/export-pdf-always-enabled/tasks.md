# Implementation Plan: Export PDF Always Enabled

## Overview

Modify `ResumeBuilder.tsx` to remove the validation gate on the Export PDF button, replacing it with click-time validation that surfaces per-section destructive toasts on failure and proceeds to PDF generation on success.

## Tasks

- [x] 1. Refactor `handleExport` and remove dead code in `ResumeBuilder.tsx`
  - Add the `SECTION_NAMES` constant mapping form keys to human-readable section names
  - Replace the existing `handleExport` implementation with the new version: call `trigger()`, collect `form.formState.errors` on failure and fire one destructive toast per errored section, then proceed to `generatePDF` on success
  - Remove the `isAllDataFilled` helper function entirely
  - Remove the `readyToExport` derived variable
  - Remove the `allDataFilled` derived variable
  - Move `setIsExporting(true)` to after the validation check (only set when validation passes)
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.2, 5.3_

- [x] 2. Update Export button rendering
  - [x] 2.1 Update the header Export button
    - Change `disabled` prop from `!readyToExport || isExporting` to `isExporting` only
    - Change `className` to always apply `bg-accent hover:bg-accent/90 text-accent-foreground` (remove the conditional muted styling)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Update the mobile toolbar Export button (if present)
    - Apply the same `disabled={isExporting}` and static accent className to any secondary Export button instances
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Clean up status indicator in header
  - Remove or leave the "Ready to export" `CheckCircle` indicator that was conditioned on `readyToExport` (it references the now-deleted variable)
  - Ensure the error count indicator (`AlertCircle`) still renders correctly using `hasErrors` — no change needed there
  - _Requirements: 5.2_

- [x] 4. Checkpoint — verify the component compiles and behaves correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Write tests for `ResumeBuilder` export behavior
  - [x] 5.1 Set up test file and shared mocks
    - Create `frontend/src/temp-ui/components/resume/__tests__/ResumeBuilder.export.test.tsx`
    - Mock `generatePDF` from `./ResumePDF`
    - Mock `useToast` to capture `toast` calls
    - Mock React Hook Form's `trigger` and `formState.errors`
    - _Requirements: 2.1, 3.1, 4.1_

  - [ ]* 5.2 Write property test for Property 1 — button always enabled when not exporting
    - **Property 1: Export button is always enabled when not exporting**
    - **Validates: Requirements 1.1, 1.2**
    - Use `fc.record` / `fc.dictionary` to generate arbitrary `formState.errors` objects
    - Assert the Export PDF button is not disabled when `isExporting` is false

  - [ ]* 5.3 Write property test for Property 2 — PDF generation called iff validation passes
    - **Property 2: PDF generation is called if and only if validation passes**
    - **Validates: Requirements 2.3, 3.3, 4.1, 5.3**
    - Use `fc.boolean()` to drive the mocked `trigger()` return value
    - Assert `generatePDF` call count is 1 when `true`, 0 when `false`

  - [ ]* 5.4 Write property test for Property 3 — one destructive toast per errored section
    - **Property 3: Each section with errors produces exactly one destructive toast**
    - **Validates: Requirements 3.1, 3.2, 3.4**
    - Use `fc.subarray` over the 7 section keys to generate random non-empty error subsets
    - Assert destructive toast count equals the number of errored sections
    - Assert each toast title contains the matching `SECTION_NAMES` value

  - [ ]* 5.5 Write property test for Property 4 — PDF errors produce destructive toast and re-enable button
    - **Property 4: PDF generation errors produce a destructive toast and re-enable the button**
    - **Validates: Requirements 4.4, 4.5**
    - Use `fc.string()` to generate arbitrary error messages for `generatePDF` rejection
    - Assert a destructive toast is shown and the Export button is not disabled after the error

  - [ ]* 5.6 Write unit tests for concrete export scenarios
    - Test: clicking Export while `isExporting=true` does nothing (button is disabled)
    - Test: when `trigger()` returns `true`, `generatePDF` is called with `watchedData`
    - Test: when `generatePDF` resolves, a success toast is shown
    - Test: when `generatePDF` rejects, `isExporting` is `false` after the handler
    - _Requirements: 1.3, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All changes are localized to `frontend/src/temp-ui/components/resume/ResumeBuilder.tsx`
- No new dependencies are introduced
- The `TOAST_LIMIT=1` behavior in `use-toast.ts` is unchanged and requires no test coverage here
