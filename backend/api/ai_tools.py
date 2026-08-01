import json
import os
import re
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user
from core.db import create_cover_letter, get_resume
from core.resume_normalizer import resume_text

router = APIRouter()


class JobMatchRequest(BaseModel):
    resumeData: Dict[str, Any]
    jobDescription: str


class ImproveBulletRequest(BaseModel):
    bullet: str
    context: Optional[str] = ""
    tone: Optional[str] = "impact"
    jobDescription: Optional[str] = ""
    resumeData: Optional[Dict[str, Any]] = None


class CoverLetterRequest(BaseModel):
    resumeId: Optional[int] = None
    resumeData: Dict[str, Any]
    jobDescription: str


def _extract_json(content: str) -> Any:
    content = (content or "").strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
    if match:
        content = match.group(1).strip()
    return json.loads(content)


def _client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI is not configured. Set OPENAI_API_KEY.")
    from openai import OpenAI

    return OpenAI(api_key=api_key, base_url=os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1"))


def _complete_json(system_prompt: str, user_prompt: str) -> Any:
    client = _client()
    model = os.getenv("AI_MODEL", "gpt-4o-mini")
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.25,
    )
    return _extract_json(response.choices[0].message.content or "{}")


@router.post("/job-match")
async def job_match(body: JobMatchRequest, user=Depends(get_current_user)):
    if not body.jobDescription.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    system = """Return only JSON with keys: score number 0-100, missingKeywords string[], strengths string[], risks string[], sectionSuggestions object. Be concise and practical."""
    result = _complete_json(
        system,
        f"Resume:\n{resume_text(body.resumeData)[:12000]}\n\nJob description:\n{body.jobDescription[:12000]}",
    )
    result.setdefault("score", 0)
    result.setdefault("missingKeywords", [])
    result.setdefault("strengths", [])
    result.setdefault("risks", [])
    result.setdefault("sectionSuggestions", {})
    return {
        "matchScore": result.get("score", result.get("matchScore", 0)),
        "missingKeywords": result["missingKeywords"],
        "strengths": result["strengths"],
        "risks": result["risks"],
        "sectionSuggestions": result["sectionSuggestions"],
    }


@router.post("/improve-bullet")
async def improve_bullet(body: ImproveBulletRequest, user=Depends(get_current_user)):
    if not body.bullet.strip():
        raise HTTPException(status_code=400, detail="Bullet is required")

    system = """Return only JSON: {"options":[{"style":"concise","text":""},{"style":"impact","text":""},{"style":"metrics","text":""}]}. No emojis. Keep each option one resume bullet."""
    result = _complete_json(
        system,
        (
            f"Bullet: {body.bullet}\n"
            f"Context: {body.context or resume_text(body.resumeData or {})}\n"
            f"Job description: {body.jobDescription or ''}\n"
            f"Tone: {body.tone or 'impact'}"
        ),
    )
    options: List[Dict[str, str]] = result.get("options") if isinstance(result, dict) else []
    if not isinstance(options, list) or not options:
        raise HTTPException(status_code=502, detail="AI returned no bullet options")
    return {"options": options[:3]}


@router.post("/cover-letter")
async def cover_letter(body: CoverLetterRequest, user=Depends(get_current_user)):
    if not body.jobDescription.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    system = """Return only JSON: {"content": "cover letter text"}. Write a polished, concise, role-specific cover letter without invented facts."""
    result = _complete_json(
        system,
        f"Resume:\n{resume_text(body.resumeData)[:12000]}\n\nJob description:\n{body.jobDescription[:12000]}",
    )
    content = result.get("content") if isinstance(result, dict) else ""
    if not content:
        raise HTTPException(status_code=502, detail="AI returned an empty cover letter")

    saved = None
    if body.resumeId and get_resume(user["id"], body.resumeId):
        saved = create_cover_letter(user["id"], body.resumeId, body.jobDescription, content)
    return {"content": content, "saved": bool(saved), "coverLetter": saved}
