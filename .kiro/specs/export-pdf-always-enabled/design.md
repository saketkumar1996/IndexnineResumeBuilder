# Design Document: Export PDF Always Enabled

## Overview

This feature changes the Export PDF button in `ResumeBuilder.tsx` from a gated control (disabled until all validation passes) to an always-enabled control that runs validation on click and surfaces errors as toast notifications.

The current implementation uses two separate gates before allowing export:
1. React Hook Form's `isValid` flag (Zod schema validation)
2. A custom `isAllDataFilled` helper that duplicates field-presence checks already covered by the schema

The new behavior collapses both gates into a single `trigger()`-based validation call inside the click handler. If validation fails, per-section destructive toasts are shown. If it passes, PDF generation proceeds as before.

No new dependencies are introduced. The change is localized to `ResumeBuilder.tsx`.

---

## Architecture

The feature touches a single component. The surrounding architecture is unchanged.

```mermaid
flowchart TD
    A[User clicks Export PDF] --> B{isExporting?}
    B -- yes --> Z[No-op: button is disabled]
    B -- no --> C[setIsExporting = true]
    C --> D[form.trigger() — validate all fields]
    D --> E{All fields valid?}
    E -- no --> F[Collect errors by section]
    F --> G[toast per section with variant: destructive]
    G --> H[setIsExporting = false]
    E -- yes --> I[generatePDF with current form data]
    I --> J{PDF generation result}
    J -- success --> K[Trigger file download]
    K --> L[toast: success]
    L --> M[setIsExporting = false]
    J -- error --> N[toast: destructive failure message]
    N --> M
```

### Key Design Decisions

**Remove `isAllDataFilled`**: The helper duplicates rules already in `ResumeSchema`. Removing it eliminates the risk of the two checks diverging over time.

**Remove `readyToExport` / `isValid` gate on the button**: The `disabled` prop on the Export button is simplified to `isExporting` only.

**Per-section error toasts**: The `errors` object from React Hook Form is keyed by section name (`header`, `expertise`, `skills`, `experiences`, `projects`, `education`, `awards`). Each key with a truthy value maps to a human-readable section name and produces one toast.

**`TOAST_LIMIT = 1` constraint**: The existing `use-toast.ts` limits the visible toast queue to 1 at a time. Multiple `toast()` calls will still fire; the UI will cycle through them as each auto-dismisses. This is acceptable behavior and requires no changes to the toast system.

---

## Components and Interfaces

### `ResumeBuilder.tsx` — changes only

**Button rendering (header + mobile toolbar)**

Before:
```tsx
<Button
  onClick={handleExport}
  disabled={!readyToExport || isExporting}
  className={`${
    readyToExport && !isExporting
      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
      : "bg-muted text-muted-foreground cursor-not-allowed"
  }`}
>
  <Download size={16} className="mr-2" />
  {isExporting ? "Exporting..." : "Export PDF"}
</Button>
```

After:
```tsx
<Button
  onClick={handleExport}
  disabled={isExporting}
  className="bg-accent hover:bg-accent/90 text-accent-foreground"
>
  <Download size={16} className="mr-2" />
  {isExporting ? "Exporting..." : "Export PDF"}
</Button>
```

**`handleExport` — section error mapping**

A static map translates form field keys to display names:

```ts
const SECTION_NAMES: Record<string, string> = {
  header:      "Contact Information",
  expertise:   "Professional Summary",
  skills:      "Technical Skills",
  experiences: "Work Experience",
  projects:    "Projects",
  education:   "Education",
  awards:      "Awards & Certifications",
};
```

**`handleExport` — new implementation**

```ts
const handleExport = async () => {
  const isFormValid = await trigger();

  if (!isFormValid) {
    const currentErrors = form.formState.errors;
    Object.keys(SECTION_NAMES).forEach((key) => {
      if (currentErrors[key as keyof typeof currentErrors]) {
        toast({
          title: `${SECTION_NAMES[key]} has errors`,
          description: "Please fix the highlighted fields before exporting.",
          variant: "destructive",
        });
      }
    });
    return;
  }

  setIsExporting(true);
  try {
    const blob = await generatePDF(watchedData);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${watchedData.header.fullName.replace(/\s+/g, "_")}_Resume.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Resume exported!",
      description: "Your resume has been downloaded as a PDF.",
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    toast({
      title: "Export failed",
      description: "There was an error generating your PDF. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsExporting(false);
  }
};
```

**Removals**

- `isAllDataFilled` function — deleted entirely
- `readyToExport` derived variable — deleted
- The `readyToExport` "Ready to export" status indicator in the header — deleted (or kept as cosmetic only, not gating)

---

## Data Models

No new data models. The feature operates entirely on existing types:

- `ResumeData` — form data type from `@/types/resume`
- `ResumeSchema` — Zod schema from `@/schemas/resume`
- `ToasterToast` — from `@/hooks/use-toast`, specifically `variant: "destructive" | "default"`

The section-to-display-name mapping (`SECTION_NAMES`) is a module-level constant, not a data model.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Before writing properties, reviewing the prework for redundancy:

- 1.1 and 1.2 are the same property (button always enabled regardless of form state) — combine into one.
- 3.3 (PDF not called on errors) and 4.1 (PDF called on success) together form a single round-trip property: PDF generation is called if and only if validation passes. Keep as one combined property.
- 3.2 and 3.4 both describe per-section toast behavior — combine into one property about the mapping between errored sections and toast count.
- 4.4 (destructive toast on PDF error) is a standalone property worth keeping.

Final set: 4 properties.

---

### Property 1: Export button is always enabled when not exporting

*For any* combination of form field values and validation state, the Export PDF button SHALL have `disabled=false` as long as `isExporting` is false.

**Validates: Requirements 1.1, 1.2**

---

### Property 2: PDF generation is called if and only if validation passes

*For any* form data state, `generatePDF` SHALL be called when `trigger()` returns `true`, and SHALL NOT be called when `trigger()` returns `false`.

**Validates: Requirements 2.3, 3.3, 4.1, 5.3**

---

### Property 3: Each section with errors produces exactly one destructive toast

*For any* non-empty subset of form sections that contain validation errors, clicking Export SHALL produce exactly one `toast()` call with `variant: "destructive"` per errored section, and the toast title SHALL identify the section by its human-readable name.

**Validates: Requirements 3.1, 3.2, 3.4**

---

### Property 4: PDF generation errors produce a destructive toast and re-enable the button

*For any* error thrown by `generatePDF`, the export handler SHALL call `toast()` with `variant: "destructive"` and SHALL set `isExporting` to `false` after the error is caught.

**Validates: Requirements 4.4, 4.5**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| One or more form sections have validation errors | One destructive toast per errored section; `isExporting` never set to `true`; button remains enabled |
| `generatePDF` throws any error | Destructive toast with "Export failed" title; `isExporting` reset to `false` via `finally` block |
| `generatePDF` resolves but blob URL creation fails | Caught by the same `catch` block; same destructive toast behavior |
| User clicks Export while `isExporting = true` | Button is `disabled`; click is ignored |

The `finally` block in `handleExport` guarantees `isExporting` is always reset, preventing the button from getting stuck in a loading state.

---

## Testing Strategy

### Unit / Example-Based Tests

These cover specific concrete behaviors:

- Clicking Export while `isExporting=true` does nothing (button is disabled)
- When `trigger()` returns `true`, `generatePDF` is called with `watchedData`
- When `generatePDF` resolves, a download link is created and clicked
- When `generatePDF` resolves, a success toast is shown
- When `generatePDF` rejects, `isExporting` is `false` after the handler

### Property-Based Tests (fast-check)

The feature has clear universal properties suitable for PBT. Use **fast-check** with **Vitest**, minimum 100 iterations per property.

Each test is tagged with its design property reference.

**Property 1 — Button always enabled when not exporting**
```
// Feature: export-pdf-always-enabled, Property 1: button always enabled when not exporting
fc.assert(fc.property(
  arbitraryFormErrors(),   // generates random error objects (empty or non-empty)
  (errors) => {
    render(<ResumeBuilder />, { formErrors: errors, isExporting: false });
    expect(screen.getByRole("button", { name: /export pdf/i })).not.toBeDisabled();
  }
), { numRuns: 100 });
```

**Property 2 — PDF generation called iff validation passes**
```
// Feature: export-pdf-always-enabled, Property 2: PDF generation called iff validation passes
fc.assert(fc.property(
  fc.boolean(),   // trigger() return value
  async (validationPasses) => {
    mockTrigger.mockResolvedValue(validationPasses);
    await fireEvent.click(exportButton);
    expect(mockGeneratePDF.mock.calls.length).toBe(validationPasses ? 1 : 0);
  }
), { numRuns: 100 });
```

**Property 3 — One destructive toast per errored section**
```
// Feature: export-pdf-always-enabled, Property 3: one destructive toast per errored section
fc.assert(fc.property(
  arbitraryErroredSections(),  // generates random non-empty subsets of section keys
  async (erroredSections) => {
    mockTrigger.mockResolvedValue(false);
    setFormErrors(erroredSections);
    await fireEvent.click(exportButton);
    const destructiveCalls = mockToast.mock.calls.filter(
      ([args]) => args.variant === "destructive"
    );
    expect(destructiveCalls.length).toBe(erroredSections.length);
    erroredSections.forEach(section => {
      expect(destructiveCalls.some(([args]) =>
        args.title.includes(SECTION_NAMES[section])
      )).toBe(true);
    });
  }
), { numRuns: 100 });
```

**Property 4 — PDF errors produce destructive toast and re-enable button**
```
// Feature: export-pdf-always-enabled, Property 4: PDF errors produce destructive toast and re-enable button
fc.assert(fc.property(
  fc.string(),   // arbitrary error message
  async (errorMessage) => {
    mockTrigger.mockResolvedValue(true);
    mockGeneratePDF.mockRejectedValue(new Error(errorMessage));
    await fireEvent.click(exportButton);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" })
    );
    expect(screen.getByRole("button", { name: /export pdf/i })).not.toBeDisabled();
  }
), { numRuns: 100 });
```

### What is NOT tested with PBT

- The `TOAST_LIMIT=1` cycling behavior — this is internal to `use-toast.ts` and already tested by that module
- The actual PDF content — covered by existing `ResumePDF` tests
- File download mechanics (`URL.createObjectURL`, `link.click`) — mocked in example tests, not suitable for PBT
