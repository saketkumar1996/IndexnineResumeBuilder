# Technology Stack

MERN: MongoDB, Express, React, Node.

## Backend
- **Runtime**: Node.js 20+ with TypeScript compiled to CommonJS
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose 8 (no SQL, no ORM migrations)
- **Auth**: bcryptjs password hashes, JWT in an httpOnly session cookie
- **Request validation**: Zod schemas for request shape
- **Documents**: `docx` for DOCX export, `mammoth` and `pdf-parse` for text extraction
- **AI**: `openai` SDK against an OpenAI-compatible base URL
- **Testing**: Vitest + Supertest + `mongodb-memory-server`

## Frontend
- **Framework**: React 18 with TypeScript
- **Form Management**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with Radix UI primitives
- **PDF**: `@react-pdf/renderer`, rendered client-side
- **Build Tool**: Vite
- **Testing**: Vitest + Testing Library + fast-check

## Architecture Patterns
- **Validation Strategy**: Resume content rules live in Zod on the client. The API
  validates request shape and enforces auth and ownership; it does not re-derive
  the content rules.
- **API Design**: RESTful endpoints under `/api`, session-cookie authenticated
- **Error Handling**: Every error responds `{ "detail": ... }`, where `detail` is a
  string or an object with `message` and `errors`
- **Response Keys**: Resume payloads expose snake_case `template_id`, `created_at`,
  `updated_at`, `resume_id` and `version_number` because the client reads those keys
- **Identifiers**: MongoDB ObjectIds serialized as 24-character strings
- **Shared Types**: `backend/src/types/resume.ts` mirrors `frontend/src/types/resume.ts`;
  the two must be kept in sync

## Common Commands

### Backend Development
```bash
cd backend
npm install
npm run dev                      # Start dev server with reload (port 8000)
npm run build                    # Compile TypeScript to dist/
npm start                        # Run the compiled server
npm test                         # Run all tests
npm run test:watch               # Watch mode
npm run typecheck                # Type-check without emitting
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev                      # Start development server (port 3000)
npm run build                    # Production build
npm test                         # Run tests
npm run preview                  # Preview production build
```

### Full Stack Testing
```bash
# Backend tests (from backend/) - starts its own in-memory MongoDB
npm test

# Frontend tests (from frontend/)
npm run test:run
```

## Key Dependencies
- **Express**: HTTP layer; relies on its native async error forwarding
- **Mongoose**: Schemas, indexes and `toApiJSON` serializers per model
- **bcryptjs**: Pure-JS hashing, chosen over `bcrypt` to avoid native builds
- **jsonwebtoken**: Signs the session cookie payload
- **multer**: In-memory multipart handling for resume uploads
- **Zod**: Request-shape validation on the server, form validation on the client
- **React Hook Form**: Performant form handling with minimal re-renders

## Gotchas
- `pdf-parse` must be imported as `pdf-parse/lib/pdf-parse.js`; the package
  entrypoint runs a debug branch that reads a local test file.
- Mongoose `Mixed` paths need `markModified("data")` after assignment or the
  update is silently dropped.
- The API refuses to start when `SESSION_SECRET` is still the example default and
  either `SESSION_SECURE=true` or a remote `MONGODB_URI` is configured.
