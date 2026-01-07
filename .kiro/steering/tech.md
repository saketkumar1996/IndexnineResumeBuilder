# Technology Stack

## Backend
- **Framework**: FastAPI 0.104.1
- **Validation**: Pydantic models with strict validation rules
- **Templating**: Jinja2 for HTML preview generation
- **Document Generation**: ReportLab for PDF export
- **Testing**: pytest + Hypothesis for property-based testing
- **Server**: Uvicorn ASGI server

## Frontend
- **Framework**: React 18.2.0 with TypeScript
- **Form Management**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest + Testing Library + fast-check

## Architecture Patterns
- **Validation Strategy**: Dual validation (Zod frontend + Pydantic backend) with identical rules
- **API Design**: RESTful endpoints with structured error responses
- **Template Rendering**: Jinja2 templates for HTML preview with ReportLab PDF generation
- **Error Handling**: Field-specific validation errors with spec references

## Common Commands

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python main.py                    # Start development server (port 8000)
pytest                           # Run all tests
pytest -v                        # Verbose test output
pytest tests/test_property_*.py   # Run property-based tests only
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
# Backend tests (from backend/)
pytest

# Frontend tests (from frontend/)
npm test
```

## Key Dependencies
- **FastAPI**: Web framework with automatic OpenAPI generation
- **Pydantic**: Data validation with custom validators for resume rules
- **Hypothesis**: Property-based testing for comprehensive validation coverage
- **Zod**: TypeScript-first schema validation matching Pydantic models
- **React Hook Form**: Performant form handling with minimal re-renders