# Project Structure

## Root Layout
```
├── backend/           # Express + TypeScript API
├── frontend/          # React TypeScript frontend
├── .kiro/             # Kiro configuration and steering
├── render.yaml        # Render deploy definition for the API
├── ENV_SETUP.md       # Environment variable reference
├── TEST_COVERAGE.md   # Test suite overview
└── README.md          # Project documentation
```

## Backend Structure (`backend/`)
```
backend/
├── src/
│   ├── config/
│   │   └── env.ts             # Typed env access, CORS list, startup secret guard
│   ├── db/
│   │   └── connect.ts         # Mongoose connect/disconnect and index sync
│   ├── middleware/
│   │   ├── auth.ts            # requireAuth, optionalAuth, currentUser
│   │   ├── errorHandler.ts    # asyncRoute, 404 and { detail } error handler
│   │   ├── httpError.ts       # HttpError plus status helpers
│   │   └── upload.ts          # multer memory storage for the file field
│   ├── models/
│   │   ├── User.ts            # Users with a unique email index
│   │   ├── Resume.ts          # Resumes with a Mixed data subdocument
│   │   ├── ResumeVersion.ts   # Snapshots, unique per (resumeId, versionNumber)
│   │   └── CoverLetter.ts     # Saved AI cover letters
│   ├── routes/
│   │   ├── auth.ts            # /api/auth register, login, me, logout
│   │   ├── resumes.ts         # /api/resumes CRUD and versions
│   │   ├── ai.ts              # /api/ai job-match, improve-bullet, cover-letter
│   │   └── files.ts           # /api/upload-resume and /api/export/docx
│   ├── services/
│   │   ├── passwords.ts       # bcrypt hashing and email rules
│   │   ├── session.ts         # JWT session cookie read/write
│   │   ├── normalize.ts       # Date and uploaded-resume normalization
│   │   ├── openai.ts          # AI client, JSON extraction, truncation
│   │   ├── prompts.ts         # System prompts
│   │   ├── docx.ts            # DOCX generation and filename derivation
│   │   ├── extract.ts         # PDF and DOCX text extraction
│   │   └── aiLog.ts           # Best-effort upload debug logs
│   ├── types/
│   │   ├── resume.ts          # ResumeData interfaces and bullet limits
│   │   └── pdf-parse.d.ts     # Types for the untyped pdf-parse module
│   ├── tests/
│   │   ├── helpers/           # In-memory MongoDB and signed-in agent helpers
│   │   ├── auth.test.ts
│   │   ├── resumes.test.ts
│   │   ├── versions.test.ts
│   │   ├── files.test.ts
│   │   ├── ai.test.ts
│   │   └── normalize.test.ts
│   ├── app.ts                 # Express app factory, exported for tests
│   └── index.ts               # Startup: secret guard, DB connect, listen
├── .env.example               # Environment template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── vitest.config.ts           # Test configuration
```

## Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── temp-ui/
│   │   ├── components/resume/  # ResumeBuilder and section components
│   │   ├── components/ui/      # Radix/shadcn primitives
│   │   └── pages/              # SignIn, NotFound
│   ├── schemas/
│   │   └── resume.ts           # Zod validation schemas
│   ├── types/
│   │   └── resume.ts           # TypeScript interfaces and sample data
│   ├── utils/
│   │   ├── api.ts              # Single API client for every backend call
│   │   ├── auth.ts             # Local/session storage helpers
│   │   └── dates.ts            # Date parsing for uploads
│   ├── test/                   # Vitest suites and setup
│   ├── App.tsx                 # Router
│   ├── main.tsx                # React entry point
│   └── index.css               # Tailwind CSS imports
├── index.html                  # HTML template
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite build, dev proxy and Vitest config
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Key Architecture Principles

### Type Synchronization
- `frontend/src/types/resume.ts` is the source of truth for the resume shape
- `backend/src/types/resume.ts` mirrors it for the DOCX and normalization code
- **Rule**: Changing one requires changing the other in the same commit

### API Contract
- `frontend/src/utils/api.ts` is the only place the frontend talks to the backend
- Resume payloads expose both `template_id` and `templateId`; the client reads either
- Errors always respond `{ "detail": ... }`
- **Rule**: New endpoints go through `utils/api.ts`, never inline `fetch` in components

### API Endpoint Pattern
- `/api/auth/*` - Session lifecycle
- `/api/resumes/*` - Per-user resume CRUD and version history
- `/api/ai/*` - AI assistance, all session-gated and key-gated
- `/api/upload-resume`, `/api/export/docx` - File in, file out
- **Rule**: Routes that read user data mount `requireAuth` and scope every query
  by `userId`, returning 404 (not 403) for records owned by someone else

### Data Access
- All persistence goes through the Mongoose models in `src/models/`
- Each model owns a `toApiJSON()` that produces the client-facing key names
- **Rule**: Routes never hand a raw Mongoose document to `res.json()`

### Testing Structure
- Backend suites live in `backend/src/tests/` and use an in-memory MongoDB
- Frontend property-based tests use fast-check
- **Rule**: Every authenticated route needs an ownership-isolation test

### Component Hierarchy
- `ResumeBuilder.tsx` - Main form orchestrator and cloud workspace
- `components/resume/*Section.tsx` - Individual section form components
- **Rule**: Form components must use React Hook Form with Zod resolvers
