# Indexnine Resume Builder

A MERN application for building company-compliant resumes with deterministic formatting.

## Project Structure

```
├── backend/           # Express + TypeScript API backed by MongoDB
├── frontend/          # React TypeScript frontend (Vite)
└── .kiro/specs/       # Specification documents
```

## Development Setup

You need Node.js 20+ and a MongoDB instance (a local `mongod`, Docker, or a free
MongoDB Atlas cluster).

### Backend Setup
```bash
cd backend
cp .env.example .env       # then set MONGODB_URI
npm install
npm run dev                # http://localhost:8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                # http://localhost:3000
```

The Vite dev server proxies `/api` to `http://localhost:8000`, so no frontend
environment variables are needed locally.

## Testing

### Backend Tests
```bash
cd backend
npm test
```

The suite starts its own in-memory MongoDB, so no running database is required.
Set `MONGODB_URI_TEST` to point the suite at an existing instance instead.

### Frontend Tests
```bash
cd frontend
npm test
```

## Architecture

```
React form  ->  Zod validation  ->  Express API  ->  MongoDB
                     |                   |
              client-side PDF      DOCX export, AI parsing
```

1. **Form Input** - Structured data collection via React Hook Form
2. **Spec Validation** - Real-time validation using Zod schemas
3. **Preview Display** - Live in-app preview across three templates
4. **PDF Export** - Rendered client-side with `@react-pdf/renderer`
5. **DOCX Export** - Generated server-side with the `docx` package
6. **Persistence** - Resumes, version snapshots and cover letters in MongoDB

## Key Features

- **Cloud workspace**: multiple resumes per account with debounced autosave
- **Version history**: named snapshots with one-click restore
- **Resume import**: upload a PDF or DOCX and have AI fill the form
- **AI tooling**: job-description match scoring, bullet rewriting, cover letters
- **Consistent output**: preview, PDF and DOCX share the same bullet limits
- **Sample data**: one-click form prefill for quick testing

## Technology Stack

### Backend
- **Express 5 + TypeScript** - HTTP API compiled with `tsc`
- **MongoDB + Mongoose 8** - Document storage for resumes and users
- **bcryptjs + JWT cookies** - Email/password auth over an httpOnly session cookie
- **docx / mammoth / pdf-parse** - DOCX generation, DOCX and PDF text extraction
- **OpenAI SDK** - Resume parsing and the AI assistance endpoints
- **Vitest + Supertest** - API tests against an in-memory MongoDB

### Frontend
- **React 18 + TypeScript** - UI with type safety
- **React Hook Form + Zod** - Performant form handling with validation
- **Tailwind CSS + Radix UI** - Styling and accessible primitives
- **Vite** - Build tool and development server
- **Vitest + Testing Library + fast-check** - Component and property-based tests

## API Endpoints

### Auth
- `POST /api/auth/register` - Create an account and start a session
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Current user (401 when signed out)
- `POST /api/auth/logout` - Clear the session cookie

### Resumes (session required)
- `GET /api/resumes` - List the caller's resumes, newest update first
- `POST /api/resumes` - Create a resume
- `GET /api/resumes/:id` - Read one resume
- `PATCH /api/resumes/:id` - Partial update (used for autosave)
- `DELETE /api/resumes/:id` - Delete a resume and its versions
- `POST /api/resumes/:id/versions` - Snapshot the current data
- `GET /api/resumes/:id/versions` - List snapshots, newest first
- `POST /api/resumes/:id/versions/:versionId/restore` - Restore a snapshot

### AI (session required, needs `OPENAI_API_KEY`)
- `POST /api/ai/job-match` - Score a resume against a job description
- `POST /api/ai/improve-bullet` - Rewrite a bullet three ways
- `POST /api/ai/cover-letter` - Draft a cover letter and save it

### Files
- `POST /api/upload-resume` - Parse an uploaded PDF or DOCX into resume data
- `POST /api/export/docx` - Download an editable Word document

### Health
- `GET /health` - Health check used by the Render deploy

Errors use `{ "detail": ... }`, where `detail` is a message string or an object
with `message` and `errors`.

## Quick Start

1. Start MongoDB, then the backend server (port 8000)
2. Start the frontend development server (port 3000)
3. Create an account with a password of at least 8 characters
4. Click "Fill Sample Data" to populate the form with valid test data
5. Watch the preview update as you edit; edits autosave to your account
6. Click "Export PDF" or "Export DOCX" to download the formatted resume
