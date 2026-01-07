# Project Structure

## Root Layout
```
├── backend/           # FastAPI backend application
├── frontend/          # React TypeScript frontend
├── .kiro/            # Kiro configuration and steering
├── README.md         # Project documentation
└── test_api.json     # API testing data
```

## Backend Structure (`backend/`)
```
backend/
├── api/
│   ├── endpoints.py      # API route definitions (/validate, /preview, /export)
│   └── __init__.py
├── models/
│   ├── resume_models.py  # Pydantic models with validation rules
│   └── __init__.py
├── rendering/
│   ├── resume_renderer.py # HTML/DOCX generation logic
│   └── __init__.py
├── templates/
│   ├── resume.html       # Main Jinja2 template
│   └── resume_partial.html # Partial template for validation errors
├── tests/
│   ├── test_api_endpoints.py           # API endpoint tests
│   ├── test_property_date_validation.py # Property-based date tests
│   ├── test_property_expertise_validation.py # Property-based expertise tests
│   └── __init__.py
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
└── pytest.ini         # Pytest configuration
```

## Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── components/
│   │   ├── forms/       # Form component implementations
│   │   └── ResumeForm.tsx # Main form component
│   ├── schemas/
│   │   └── resume.ts    # Zod validation schemas (mirrors Pydantic)
│   ├── types/
│   │   └── resume.ts    # TypeScript interfaces
│   ├── test/
│   │   └── setup.ts     # Test configuration
│   ├── App.tsx          # Main React component
│   ├── main.tsx         # React entry point
│   └── index.css        # Tailwind CSS imports
├── index.html           # HTML template
├── package.json         # Node.js dependencies and scripts
├── vite.config.ts       # Vite build configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Key Architecture Principles

### Model Synchronization
- `backend/models/resume_models.py` defines Pydantic models
- `frontend/src/schemas/resume.ts` mirrors validation rules with Zod
- `frontend/src/types/resume.ts` provides TypeScript interfaces
- **Rule**: All validation logic must be identical between frontend and backend

### API Endpoints Pattern
- `/api/validate` - Validates resume data, returns structured errors
- `/api/preview` - Generates HTML preview with validation
- `/api/export` - Creates DOCX file (only for valid data)

### Testing Structure
- Property-based tests in `backend/tests/test_property_*.py`
- Use Hypothesis for comprehensive validation coverage
- Frontend tests use fast-check for property-based testing
- **Rule**: All validation rules must have property-based test coverage

### Template Organization
- `templates/resume.html` - Complete resume template
- `templates/resume_partial.html` - Error state template
- Templates must produce identical layout to DOCX output

### Component Hierarchy
- `ResumeForm.tsx` - Main form orchestrator
- `components/forms/` - Individual section form components
- Each form component handles its own validation state
- **Rule**: Form components must use React Hook Form with Zod resolvers