"""
LinkedIn OAuth routes for "Extract from LinkedIn" automatic import.
Mounted at /api/linkedin so paths are /api/linkedin/auth and /api/linkedin/callback.
Also provides POST /parse-profile for AI-powered extraction from pasted profile text.
"""

import base64
import json
import os
import re
from typing import Any, Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

router = APIRouter()


class ParseProfileRequest(BaseModel):
    text: str

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI")
FRONTEND_REDIRECT_URL = os.getenv("FRONTEND_REDIRECT_URL", "http://localhost:3000")


@router.get("/auth")
async def linkedin_auth():
    """Redirect user to LinkedIn consent page. After approval, LinkedIn redirects to /api/linkedin/callback."""
    if not (LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET and LINKEDIN_REDIRECT_URI):
        raise HTTPException(
            status_code=500,
            detail="LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_REDIRECT_URI.",
        )
    # Use OpenID-style scopes now that OpenID is enabled
    params = {
        "response_type": "code",
        "client_id": LINKEDIN_CLIENT_ID,
        "redirect_uri": LINKEDIN_REDIRECT_URI,
        "scope": "openid profile email",
        "state": "indexnine-resume",
    }
    auth_url = "https://www.linkedin.com/oauth/v2/authorization?" + urlencode(params)
    return RedirectResponse(auth_url, status_code=302)


@router.get("/callback")
async def linkedin_callback(
    code: Optional[str] = None,
    state: str = "",
    error: Optional[str] = None,
    error_description: Optional[str] = None,
):
    """Exchange code for token, fetch profile + email, redirect to frontend with encoded resume data."""
    if not (LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET and LINKEDIN_REDIRECT_URI):
        raise HTTPException(
            status_code=500,
            detail="LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_REDIRECT_URI.",
        )

    # Handle LinkedIn errors gracefully so we don't 422 on missing code
    if error:
        # Surface the LinkedIn error back to the frontend
        raise HTTPException(
            status_code=400,
            detail={
                "message": "LinkedIn returned an error",
                "error": error,
                "error_description": error_description,
                "state": state,
            },
        )

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Missing 'code' query parameter from LinkedIn callback.",
        )
    token_url = "https://www.linkedin.com/oauth/v2/accessToken"
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": LINKEDIN_REDIRECT_URI,
        "client_id": LINKEDIN_CLIENT_ID,
        "client_secret": LINKEDIN_CLIENT_SECRET,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_resp = await client.post(token_url, data=token_data)
            token_resp.raise_for_status()
            token_json = token_resp.json()
            access_token = token_json.get("access_token")
            if not access_token:
                raise HTTPException(status_code=500, detail="Failed to obtain LinkedIn access token.")
            # OpenID Connect: use UserInfo endpoint ( /v2/me returns 403 with OIDC tokens )
            headers = {"Authorization": f"Bearer {access_token}"}
            userinfo_resp = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers=headers,
            )
            userinfo_resp.raise_for_status()
            profile = userinfo_resp.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Error communicating with LinkedIn: {str(e)}")

    # UserInfo schema: sub, name, given_name, family_name, picture, locale, email (optional)
    full_name = profile.get("name") or ""
    if not full_name and (profile.get("given_name") or profile.get("family_name")):
        full_name = f"{profile.get('given_name', '')} {profile.get('family_name', '')}".strip()
    primary_email = profile.get("email") or ""
    # UserInfo does not include headline; use a placeholder
    designation = "Professional"
    resume_data = {
        "header": {
            "fullName": full_name,
            "designation": designation,
            "email": primary_email,
            "phone": "",
            "location": "",
            "linkedin": "",
            "github": "",
            "portfolio": "",
        },
        "expertise": {"summary": "", "bulletPoints": []},
        "skills": {"skills": ""},
        "experiences": [],
        "projects": [],
        "education": [],
        "awards": [],
    }
    json_str = json.dumps(resume_data)
    encoded = base64.urlsafe_b64encode(json_str.encode("utf-8")).decode("ascii").rstrip("=")
    redirect_url = f"{FRONTEND_REDIRECT_URL}?linkedin_data={encoded}"
    return RedirectResponse(redirect_url, status_code=302)


# --- AI-powered parse from pasted LinkedIn profile ---

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


def _extract_json_from_response(content: str) -> dict[str, Any]:
    """Pull raw JSON out of AI response (handles markdown code blocks)."""
    content = content.strip()
    # Strip markdown code block if present
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

        client = OpenAI(api_key=api_key)
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
