from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, ValidationError
from typing import List, Dict, Any, Optional
from models.resume_models import ResumeModel
import os
import json
import re

router = APIRouter()
AI_OUTPUT_LOG_DIR = Path(os.getenv("AI_OUTPUT_LOG_DIR", Path(__file__).resolve().parents[1] / "ai_output_logs"))
PROFESSIONAL_EXPERIENCE_BULLET_LIMIT = 3
PROJECT_EXPERIENCE_BULLET_LIMIT = 2


def _validated_resume_from_any_shape(resume_data: Dict[str, Any]) -> ResumeModel:
    return ResumeModel(**normalize_resume_input(resume_data))


def _filename_from_resume(resume_data: Dict[str, Any], extension: str) -> str:
    header = resume_data.get("header") or {}
    name = header.get("fullName") or header.get("name") or "resume"
    safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", name).strip("_") or "resume"
    return f"{safe_name}.{extension}"


def _add_docx_bullets(doc, items: List[str], limit: Optional[int] = None):
    for item in items[:limit] if limit else items:
        if str(item or "").strip():
            doc.add_paragraph(str(item).strip(), style="List Bullet")


def _generate_docx_bytes(resume_data: Dict[str, Any]) -> bytes:
    from docx import Document
    from io import BytesIO

    doc = Document()
    header = resume_data.get("header") or {}
    expertise = resume_data.get("expertise") or {}
    skills = resume_data.get("skills") or {}

    doc.add_heading(header.get("fullName") or header.get("name") or "Resume", 0)
    title = header.get("designation") or header.get("title")
    contact = " | ".join(
        value
        for value in [
            title,
            header.get("email"),
            header.get("phone"),
            header.get("location"),
            header.get("linkedin"),
            header.get("github"),
            header.get("portfolio"),
        ]
        if value
    )
    if contact:
        doc.add_paragraph(contact)

    if expertise.get("summary"):
        doc.add_heading("Professional Summary", level=1)
        doc.add_paragraph(expertise["summary"])
    _add_docx_bullets(doc, expertise.get("bulletPoints") or [])

    if skills.get("skills"):
        doc.add_heading("Skills", level=1)
        doc.add_paragraph(skills["skills"])

    experiences = resume_data.get("experiences") or resume_data.get("experience") or []
    if experiences:
        doc.add_heading("Professional Experience", level=1)
        for exp in experiences:
            company = exp.get("company", "")
            role = exp.get("title") or exp.get("position") or ""
            dates = " - ".join(value for value in [exp.get("startDate") or exp.get("start_date"), exp.get("endDate") or exp.get("end_date")] if value)
            doc.add_paragraph(f"{role} | {company} | {dates}".strip(" |"))
            _add_docx_bullets(doc, exp.get("responsibilities") or [], PROFESSIONAL_EXPERIENCE_BULLET_LIMIT)

    if resume_data.get("projects"):
        doc.add_heading("Selected Projects", level=1)
        for project in resume_data.get("projects") or []:
            if not project.get("name") and not project.get("description"):
                continue
            doc.add_paragraph(project.get("name") or "Project", style="List Bullet")
            if project.get("technologies"):
                doc.add_paragraph(f"Technologies: {project['technologies']}")
            if project.get("description"):
                doc.add_paragraph(project["description"])
            _add_docx_bullets(doc, project.get("responsibilities") or [], PROJECT_EXPERIENCE_BULLET_LIMIT)

    if resume_data.get("education"):
        doc.add_heading("Education", level=1)
        for edu in resume_data.get("education") or []:
            if edu.get("institution") or edu.get("degree"):
                dates = " - ".join(value for value in [edu.get("startYear"), edu.get("endYear")] if value)
                doc.add_paragraph(f"{edu.get('degree', '')} | {edu.get('institution', '')} | {dates}".strip(" |"))

    if resume_data.get("awards"):
        doc.add_heading("Awards & Certifications", level=1)
        for award in resume_data.get("awards") or []:
            if award.get("title"):
                doc.add_paragraph(
                    " | ".join(value for value in [award.get("title"), award.get("organization"), award.get("year")] if value),
                    style="List Bullet",
                )

    out = BytesIO()
    doc.save(out)
    return out.getvalue()


class ValidationResponse(BaseModel):
    """Response model for validation endpoint"""
    valid: bool
    errors: Optional[List[Dict[str, Any]]] = None
    data: Optional[Dict[str, Any]] = None


class PreviewResponse(BaseModel):
    """Response model for preview generation endpoint"""
    html: str
    valid: bool
    errors: Optional[List[Dict[str, Any]]] = None


@router.post("/validate", response_model=ValidationResponse)
async def validate_resume(resume_data: Dict[str, Any]) -> ValidationResponse:
    """
    Validate resume data against spec
    
    This endpoint validates the complete resume data structure using Pydantic models
    and returns structured validation results with field-specific errors.
    
    Requirements: 5.2, 5.3, 5.4
    """
    try:
        validated_resume = _validated_resume_from_any_shape(resume_data)
        
        return ValidationResponse(
            valid=True,
            data=validated_resume.model_dump(),
            errors=None
        )
        
    except ValidationError as e:
        # Format Pydantic validation errors for frontend consumption
        formatted_errors = []
        
        for error in e.errors():
            # Extract field path and error details
            field_path = ".".join(str(loc) for loc in error["loc"])
            error_msg = error["msg"]
            error_type = error["type"]
            
            formatted_error = {
                "field": field_path,
                "message": error_msg,
                "type": error_type,
                "input": error.get("input", None)
            }
            
            # Add spec reference based on error type
            if "word" in error_msg.lower():
                formatted_error["spec_reference"] = "Requirements 2.3"
            elif "date" in error_msg.lower() or "MMM YYYY" in error_msg:
                formatted_error["spec_reference"] = "Requirements 2.2"
            elif "responsibilities" in error_msg.lower():
                formatted_error["spec_reference"] = "Requirements 2.4"
            elif "emoji" in error_msg.lower() or "icon" in error_msg.lower():
                formatted_error["spec_reference"] = "Requirements 2.5"
            elif "comma" in error_msg.lower():
                formatted_error["spec_reference"] = "Requirements 6.2"
            
            formatted_errors.append(formatted_error)
        
        return ValidationResponse(
            valid=False,
            errors=formatted_errors,
            data=None
        )
    
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during validation: {str(e)}"
        )


@router.post("/preview", response_model=PreviewResponse)
async def generate_preview(resume_data: Dict[str, Any]) -> PreviewResponse:
    """
    Generate HTML preview for validated data
    
    This endpoint first validates the resume data, then generates an HTML preview
    using Jinja2 templates that mirror the DOCX layout.
    
    Requirements: 3.2, 3.5
    """
    try:
        # First validate the data
        validated_resume = _validated_resume_from_any_shape(resume_data)
        
        # Import renderer here to avoid circular imports
        from rendering.resume_renderer import ResumeRenderer
        
        # Generate HTML preview
        renderer = ResumeRenderer(template_path="templates")
        html_content = renderer.render_html(validated_resume)
        
        return PreviewResponse(
            html=html_content,
            valid=True,
            errors=None
        )
        
    except ValidationError as e:
        # Generate partial preview with available data
        try:
            from rendering.resume_renderer import ResumeRenderer
            renderer = ResumeRenderer(template_path="templates")
            
            # Create a partial HTML preview showing what we have
            partial_html = renderer.render_partial_html(resume_data)
            
            # Format validation errors
            formatted_errors = []
            for error in e.errors():
                field_path = ".".join(str(loc) for loc in error["loc"])
                formatted_errors.append({
                    "field": field_path,
                    "message": error["msg"],
                    "type": error["type"]
                })
            
            return PreviewResponse(
                html=partial_html,
                valid=False,
                errors=formatted_errors
            )
            
        except Exception:
            # Fallback to error message
            formatted_errors = []
            for error in e.errors():
                field_path = ".".join(str(loc) for loc in error["loc"])
                formatted_errors.append({
                    "field": field_path,
                    "message": error["msg"],
                    "type": error["type"]
                })
            
            return PreviewResponse(
                html="<div class='error'>Validation errors prevent preview generation. Please fix the errors and try again.</div>",
                valid=False,
                errors=formatted_errors
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating preview: {str(e)}"
        )


@router.post("/export")
async def export_pdf(resume_data: Dict[str, Any]):
    """
    Generate PDF file for validated data
    
    This endpoint validates the resume data and generates a PDF file using
    WeasyPrint library with HTML template rendering.
    
    Requirements: 4.1, 4.5
    """
    try:
        # First validate the data
        validated_resume = _validated_resume_from_any_shape(resume_data)
        
        # Import renderer and FastAPI response classes
        from rendering.resume_renderer import ResumeRenderer
        
        # Generate PDF document
        renderer = ResumeRenderer(template_path="templates")
        pdf_bytes = renderer.generate_pdf(validated_resume)
        
        # Return PDF response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=resume.pdf"}
        )
        
    except ValidationError as e:
        # Return validation error - export should only proceed if validation passes
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Validation failed - export blocked",
                "errors": [
                    {
                        "field": ".".join(str(loc) for loc in error["loc"]),
                        "message": error["msg"]
                    }
                    for error in e.errors()
                ]
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating PDF export: {str(e)}"
        )


# Resume extraction prompt for AI
RESUME_SCHEMA_PROMPT = """You are a resume parser. Extract structured resume data from the uploaded resume document (PDF or DOCX).

Return ONLY valid JSON (no markdown, no code fences, no explanation). Use this exact structure:

{
  "header": {
    "fullName": "string",
    "designation": "string",
    "email": "string or empty",
    "phone": "string or empty",
    "location": "string or empty",
    "linkedin": "string or empty",
    "github": "string or empty",
    "portfolio": "string or empty"
  },
  "expertise": {
    "summary": "string, 80-120 words professional summary",
    "bulletPoints": ["string", "string"]
  },
  "skills": { "skills": "comma-separated string" },
  "experiences": [
    { "company": "", "title": "", "location": "", "startDate": "MMM YYYY", "endDate": "MMM YYYY or Present" }
  ],
  "projects": [
    { "name": "", "description": "", "technologies": "", "link": "" }
  ],
  "education": [
    { "institution": "", "degree": "", "location": "", "startYear": "YYYY", "endYear": "YYYY", "gpa": "", "honors": "" }
  ],
  "awards": [
    { "title": "", "year": "YYYY", "organization": "" }
  ]
}

Rules: Use empty string for missing fields. Dates: "Jan 2020", "Present". Years: "2015", "2019". Extract everything you can find; omit arrays if none found."""


def _extract_json_from_response(content: str) -> Dict[str, Any]:
    """Pull raw JSON out of AI response (handles markdown code blocks)."""
    content = content.strip()
    # Strip markdown code block if present
    m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
    if m:
        content = m.group(1).strip()
    return json.loads(content)


def _extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file."""
    try:
        import PyPDF2
        from io import BytesIO
        
        pdf_file = BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract text from PDF: {str(e)}"
        )


def _extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file."""
    try:
        from docx import Document
        from io import BytesIO
        
        docx_file = BytesIO(file_content)
        doc = Document(docx_file)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        # Also extract text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + " "
                text += "\n"
        return text
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract text from DOCX: {str(e)}"
        )


@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Upload a resume file (PDF or DOCX) and extract structured data using AI.
    
    This endpoint accepts PDF or DOCX files, extracts text, and uses AI to parse
    the resume content into structured data matching the ResumeData schema.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = file.filename.lower().split(".")[-1]
    if file_extension not in ["pdf", "docx"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a PDF or DOCX file."
        )
    
    # Check if OpenAI API key is configured
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI parse is not configured. Set OPENAI_API_KEY in backend/.env",
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Extract text based on file type
        if file_extension == "pdf":
            extracted_text = _extract_text_from_pdf(file_content)
        else:  # docx
            extracted_text = _extract_text_from_docx(file_content)
        
        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the uploaded file. Please ensure the file contains readable text."
            )
        
        # Use AI to parse the extracted text
        from openai import OpenAI
        
        base_url = os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1")
        client = OpenAI(api_key=api_key, base_url=base_url)
        
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": RESUME_SCHEMA_PROMPT},
                {"role": "user", "content": extracted_text.strip()[:12000]},
            ],
            temperature=0.2,
        )
        
        raw = resp.choices[0].message.content or "{}"
        data = _extract_json_from_response(raw)
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {e}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to process resume: {str(e)}")
    
    # Normalize shape so frontend gets expected keys
    if "header" not in data:
        data["header"] = {}
    for key in ("fullName", "designation", "email", "phone", "location", "linkedin", "github", "portfolio"):
        data["header"].setdefault(key, "")
    data.setdefault("expertise", {"summary": "", "bulletPoints": []})
    data.setdefault("skills", {"skills": ""})
    data.setdefault("experiences", [])
    data.setdefault("projects", [])
    data.setdefault("education", [])
    data.setdefault("awards", [])
    
    return data
