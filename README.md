# Indexnine Resume Builder

A spec-driven system that generates company-compliant resumes with zero AI assistance or dynamic formatting.

## Project Structure

```
├── backend/           # FastAPI backend with Pydantic validation
├── frontend/          # React TypeScript frontend
└── .kiro/specs/       # Specification documents
```

## Development Setup

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Architecture

The system follows a strict pipeline:
1. **Form Input** → Structured data collection via React Hook Form
2. **Spec Validation** → Real-time validation using Zod schemas
3. **Pydantic Validation** → Server-side validation with detailed errors
4. **HTML Rendering** → Jinja2 templates for preview generation
5. **Preview Display** → Isolated iframe with identical formatting
6. **DOCX Generation** → python-docx for final document export

## Key Features

- **Indexnine Output**: Preview and DOCX files match exactly
- **Strict Validation**: Enforces company standards with detailed error feedback
- **Real-time Feedback**: Live validation and preview updates
- **Property-Based Testing**: Comprehensive correctness validation
- **ATS-Friendly**: Generates structured, parseable documents