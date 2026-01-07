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
5. **Preview Display** → Isolated iframe with consistent formatting
6. **PDF Generation** → ReportLab for final document export

## Key Features

- **Consistent Output**: Preview and PDF files maintain consistent formatting
- **Strict Validation**: Enforces company standards with detailed error feedback
- **Real-time Feedback**: Live validation and preview updates
- **Property-Based Testing**: Comprehensive correctness validation
- **ATS-Friendly**: Generates structured, parseable PDF documents
- **Sample Data**: One-click form prefill for quick testing and preview

## Technology Stack

### Backend
- **FastAPI 0.104.1** - Web framework with automatic OpenAPI generation
- **Pydantic** - Data validation with custom validators for resume rules
- **Jinja2** - HTML template rendering for preview generation
- **ReportLab** - Professional PDF document generation
- **pytest + Hypothesis** - Property-based testing for comprehensive validation

### Frontend
- **React 18.2.0 + TypeScript** - Modern UI framework with type safety
- **React Hook Form + Zod** - Performant form handling with validation
- **Tailwind CSS** - Utility-first styling framework
- **Vite** - Fast build tool and development server

## API Endpoints

- `POST /api/validate` - Validates resume data, returns structured errors
- `POST /api/preview` - Generates HTML preview with validation
- `POST /api/export` - Creates PDF file (only for valid data)

## Quick Start

1. Start the backend server (port 8000)
2. Start the frontend development server (port 3000)
3. Click "Fill Sample Data" to populate the form with valid test data
4. See real-time preview updates as you edit
5. Click "Export PDF" to download the formatted resume