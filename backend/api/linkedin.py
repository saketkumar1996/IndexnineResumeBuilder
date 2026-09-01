"""AI-powered extraction from pasted LinkedIn/profile text.

Mounted at /api/linkedin so the path is POST /api/linkedin/parse-profile.
"""

import json
import os
import re
from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class ParseProfileRequest(BaseModel):
    text: str


RESUME_SCHEMA_PROMPT = """You are a resume parser. Extract structured resume data from the pasted LinkedIn (or similar) profile text.

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
    "summary": "string, 50-200 words professional summary",
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
    m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
    if m:
        content = m.group(1).strip()
    return json.loads(content)


@router.post("/parse-profile")
async def parse_profile_with_ai(body: ParseProfileRequest):
    """Use AI to extract resume data from pasted LinkedIn/profile text. Requires OPENAI_API_KEY."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI parse is not configured. Set OPENAI_API_KEY in backend/.env",
        )
    if not (body.text or "").strip():
        raise HTTPException(status_code=400, detail="Request body must include non-empty 'text'.")

    try:
        from openai import OpenAI

        base_url = os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1")
        client = OpenAI(api_key=api_key, base_url=base_url)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": RESUME_SCHEMA_PROMPT},
                {"role": "user", "content": body.text.strip()[:12000]},
            ],
            temperature=0.2,
        )
        raw = resp.choices[0].message.content or "{}"
        data = _extract_json_from_response(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI parse failed: {e}")

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
