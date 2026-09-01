# Test Coverage Summary

This document outlines the test suite for the Indexnine Resume Builder, covering
the Express API and the React frontend.

## Backend Tests (`backend/src/tests/`)

Runner: Vitest with Supertest. Each suite that needs a database starts an
in-memory MongoDB via `mongodb-memory-server`, so `npm test` needs no running
services. Set `MONGODB_URI_TEST` to use an existing instance instead.

### API Tests
- **`auth.test.ts`** - Registration, login, session cookie issue/clear, `/api/auth/me`,
  duplicate email conflicts, email and password validation, tampered cookies
- **`resumes.test.ts`** - Resume CRUD, defaults, partial updates, list ordering,
  cascade delete of versions, malformed ids, and per-user ownership isolation
- **`versions.test.ts`** - Snapshot numbering and labels, listing order, restore
  semantics, and 404s for versions the caller does not own
- **`files.test.ts`** - DOCX export payload, content type and filename, upload
  validation, the `{ detail }` error envelope, and 404s for the retired endpoints
- **`ai.test.ts`** - Auth requirements and request validation for the AI routes,
  plus the 503 responses when `OPENAI_API_KEY` is absent

### Unit Tests
- **`normalize.test.ts`** - Date normalization to `MMM YYYY`, combined date range
  splitting, uploaded-resume field aliases, bullet limit clamping, and the
  resume-to-text flattening used for AI prompts

### Test Coverage Areas

#### Authentication and Sessions
1. **Password hashing** - bcrypt hashes are never returned by the API
2. **Session cookies** - httpOnly issue on register/login, cleared on logout
3. **Rejection paths** - Invalid email, short password, duplicate email, bad password
4. **Token integrity** - Forged or malformed session cookies are rejected

#### Authorization
- Every `/api/resumes` and `/api/ai` route returns 401 without a session
- A second account cannot read, update, delete, or snapshot another user's resume
- Unowned records return 404 rather than 403, so ids are not enumerable

#### Data Persistence
- Nested resume `data` survives round trips through MongoDB unchanged
- Autosave `PATCH` applies title, template and data independently
- Version snapshots capture data at save time and restore it later
- Deleting a resume also deletes its version history

#### Contract Stability
- Responses carry the snake_case keys the client reads: `template_id`,
  `created_at`, `updated_at`, `resume_id`, `version_number`
- Errors use `{ "detail": ... }` so the client's `readErrorMessage` keeps working
- Ids are 24-character ObjectId strings

## Frontend Tests (`frontend/src/test/`)

### Validation Tests
  - **`validation.test.ts`** - Property-based tests using fast-check for Zod schema validation
  - Covers all form fields with valid/invalid data generation
  - Boundary condition testing for word counts and formats

### Component Tests
- **`components.test.tsx`** - React component testing using Testing Library
  - Form rendering and user interaction testing
  - Dynamic form section management (add/remove entries)
  - Uploaded resume normalization unit tests

### Auth Flow Tests
- **`auth-flow.test.tsx`** - Sign-in UI, session redirects, logout preserving the
  session draft, and guest redirects

### Test Configuration
- **`setup.ts`** - Test environment configuration with mocks and utilities
- **`vite.config.ts`** - Vitest configuration (jsdom environment)

## Testing Strategy

### Where validation lives
Resume validation is client-side via Zod. The API validates request *shape* with
Zod and enforces auth and ownership, but does not re-derive the resume content
rules. Tests are split accordingly: content rules are covered in the frontend
suite, contract and authorization rules in the backend suite.

### Property-Based Testing
- **Frontend**: Uses fast-check for comprehensive input validation
- **Backend**: Table-driven cases for the date and alias normalizers, which are
  the highest-risk pure functions in the API

### Integration Testing
- **API**: Full request/response cycle through the real Express app and a real
  MongoDB instance, driven with the same payloads the client sends
- **Binary output**: DOCX exports are asserted to be valid zip archives with the
  correct content type and filename

## Test Execution

### Backend Testing
```bash
cd backend
npm test                         # Run all tests
npm run test:watch               # Watch mode
npm run build                    # Type-check via the deploy compile
```

### Frontend Testing
```bash
cd frontend
npm test                         # Watch mode
npm run test:run                 # Single run
npm run test:coverage            # Run with coverage
```

## Key Test Scenarios

### Valid Data Scenarios
- Complete resume with all sections filled
- Minimal resume with only required fields
- Various date formats and Present values

### Invalid Data Scenarios
- Missing required fields and empty sections
- Invalid formats (email, phone, dates)
- Malformed ids and malformed JSON bodies
- Unsupported upload types

### Edge Cases
- Junk or null input to the normalizers
- Two-digit years around the 50 pivot
- Empty resume exported to DOCX
- Concurrent registration on the same email

### Error Handling
- Structured `{ detail }` responses the client renders directly
- 503 when AI is not configured, 502 when the AI returns unusable JSON
- 404 instead of 403 for records owned by another user

## Continuous Integration

The `CI` workflow runs three jobs on every push and pull request:

- **Frontend build** - `npm ci && npm run build` from a clean checkout
- **Frontend tests** - `npm run test:run`
- **Backend tests** - `npm ci && npm run build && npm test`, which compiles the
  same way Render does and runs the API suite against an in-memory MongoDB
