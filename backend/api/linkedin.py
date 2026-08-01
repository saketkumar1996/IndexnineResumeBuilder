"""
LinkedIn OAuth routes for "Extract from LinkedIn" automatic import.
Mounted at /api/linkedin so paths are /api/linkedin/auth and /api/linkedin/callback.
Also provides POST /parse-profile for AI-powered extraction from pasted profile text.
"""

import base64
import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Optional, Dict
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from core.auth import set_session_cookie
from core.db import create_resume, list_resumes, upsert_linkedin_user

router = APIRouter()


class ParseProfileRequest(BaseModel):
    text: str

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI")
FRONTEND_REDIRECT_URL = os.getenv("FRONTEND_REDIRECT_URL", "http://localhost:3000")


def _build_resume_data_from_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Convert LinkedIn userinfo into the frontend resume data shape."""
    full_name = profile.get("name") or ""
    if not full_name and (profile.get("given_name") or profile.get("family_name")):
        full_name = f"{profile.get('given_name', '')} {profile.get('family_name', '')}".strip()

    return {
        "header": {
            "fullName": full_name,
            "designation": "Professional",
            "email": profile.get("email") or "",
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


def _extract_profile_picture(profile: Dict[str, Any]) -> str:
    """Return a profile picture URL from LinkedIn OIDC or legacy profile shapes."""
    direct_picture = profile.get("picture") or profile.get("pictureUrl") or profile.get("profile_picture")
    if isinstance(direct_picture, str):
        return direct_picture

    profile_picture = profile.get("profilePicture")
    if not isinstance(profile_picture, dict):
        return ""

    display_image = profile_picture.get("displayImage~")
    if not isinstance(display_image, dict):
        return ""

    elements = display_image.get("elements")
    if not isinstance(elements, list):
        return ""

    for element in reversed(elements):
        identifiers = element.get("identifiers") if isinstance(element, dict) else None
        if not isinstance(identifiers, list):
            continue
        for identifier in identifiers:
            url = identifier.get("identifier") if isinstance(identifier, dict) else None
            if isinstance(url, str) and url:
                return url

    return ""


def _build_linkedin_auth_payload(
    profile: Dict[str, Any],
    signed_in_at: Optional[str] = None,
) -> Dict[str, Any]:
    """Build the OAuth callback payload consumed by the frontend."""
    resume_data = _build_resume_data_from_profile(profile)
    return {
        "profile": {
            "provider": "linkedin",
            "name": resume_data["header"]["fullName"],
            "email": resume_data["header"]["email"],
            "picture": _extract_profile_picture(profile),
            "signedInAt": signed_in_at or datetime.now(timezone.utc).isoformat(),
        },
        "resumeData": resume_data,
    }


def _encode_redirect_payload(payload: Dict[str, Any]) -> str:
    json_str = json.dumps(payload)
    return base64.urlsafe_b64encode(json_str.encode("utf-8")).decode("ascii").rstrip("=")


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
    # Handle LinkedIn errors gracefully so we don't 422 on missing code
    if error:
        params = {"linkedin_error": error}
        if error_description:
            params["linkedin_error_description"] = error_description
        if state:
            params["state"] = state
        return RedirectResponse(f"{FRONTEND_REDIRECT_URL}/signin?{urlencode(params)}", status_code=302)

    if not (LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET and LINKEDIN_REDIRECT_URI):
        raise HTTPException(
            status_code=500,
            detail="LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_REDIRECT_URI.",
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
        params = {"linkedin_error": "linkedin_request_failed", "linkedin_error_description": str(e)}
        return RedirectResponse(f"{FRONTEND_REDIRECT_URL}/signin?{urlencode(params)}", status_code=302)

    auth_payload = _build_linkedin_auth_payload(profile)
    profile_for_db = {
        **profile,
        "picture": auth_payload["profile"]["picture"],
    }
    try:
        user = upsert_linkedin_user(profile_for_db)
        auth_payload["profile"]["id"] = user["id"]
        existing_resumes = list_resumes(int(user["id"]))
        if existing_resumes:
            auth_payload["resumeId"] = existing_resumes[0]["id"]
        else:
            created_resume = create_resume(
                int(user["id"]),
                "LinkedIn Resume",
                "indexnine",
                auth_payload["resumeData"],
            )
            auth_payload["resumeId"] = created_resume["id"]
    except Exception as e:
        params = {"linkedin_error": "account_setup_failed", "linkedin_error_description": str(e)}
        return RedirectResponse(f"{FRONTEND_REDIRECT_URL}/signin?{urlencode(params)}", status_code=302)

    encoded = _encode_redirect_payload(auth_payload)
    redirect_url = f"{FRONTEND_REDIRECT_URL}/signin?linkedin_auth={encoded}"
    response = RedirectResponse(redirect_url, status_code=302)
    set_session_cookie(response, int(user["id"]))
    return response


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


def _extract_json_from_response(content: str) -> Dict[str, Any]:
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

        # Use OpenRouter's API endpoint (compatible with OpenAI client)
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
