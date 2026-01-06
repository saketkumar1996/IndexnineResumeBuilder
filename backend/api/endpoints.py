from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError
from typing import List, Dict, Any, Optional
from models.resume_models import ResumeModel

router = APIRouter()


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
        # Attempt to validate the resume data using Pydantic model
        validated_resume = ResumeModel(**resume_data)
        
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
        validated_resume = ResumeModel(**resume_data)
        
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
async def export_docx(resume_data: Dict[str, Any]):
    """
    Generate DOCX file for validated data
    
    This endpoint validates the resume data and generates a DOCX file using
    python-docx library with the Company_Template structure.
    
    Requirements: 4.1, 4.5
    """
    try:
        # First validate the data
        validated_resume = ResumeModel(**resume_data)
        
        # Import renderer and FastAPI response classes
        from rendering.resume_renderer import ResumeRenderer
        from fastapi.responses import FileResponse
        import tempfile
        import os
        from uuid import uuid4
        
        # Generate DOCX document
        renderer = ResumeRenderer(template_path="templates")
        doc = renderer.generate_docx(validated_resume)
        
        # Save to temporary file
        temp_dir = tempfile.gettempdir()
        temp_filename = f"resume_{uuid4()}.docx"
        temp_path = os.path.join(temp_dir, temp_filename)
        
        doc.save(temp_path)
        
        # Return file response
        return FileResponse(
            path=temp_path,
            filename="resume.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=resume.docx"}
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
            detail=f"Error generating DOCX export: {str(e)}"
        )