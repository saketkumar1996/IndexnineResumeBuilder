import base64
import hashlib
import hmac
import os
import time
from typing import Dict, Optional

from fastapi import Depends, HTTPException, Request, Response

from core.db import get_user_by_id


SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "indexnine_session")
SESSION_SECRET = os.getenv("SESSION_SECRET", os.getenv("SECRET_KEY", "dev-indexnine-change-me"))
SESSION_MAX_AGE_SECONDS = int(os.getenv("SESSION_MAX_AGE_SECONDS", str(60 * 60 * 24 * 14)))
SESSION_SECURE = os.getenv("SESSION_SECURE", "false").lower() == "true"
SAME_SITE = os.getenv("SESSION_SAMESITE", "lax")


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _sign(payload: str) -> str:
    digest = hmac.new(SESSION_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest()
    return _b64(digest)


def create_session_token(user_id: int) -> str:
    issued_at = int(time.time())
    payload = f"{user_id}.{issued_at}"
    return f"{payload}.{_sign(payload)}"


def read_session_token(token: str) -> Optional[int]:
    try:
        user_id, issued_at, signature = token.split(".", 2)
        payload = f"{user_id}.{issued_at}"
        if not hmac.compare_digest(_sign(payload), signature):
            return None
        if int(time.time()) - int(issued_at) > SESSION_MAX_AGE_SECONDS:
            return None
        return int(user_id)
    except (TypeError, ValueError):
        return None


def set_session_cookie(response: Response, user_id: int):
    response.set_cookie(
        SESSION_COOKIE_NAME,
        create_session_token(user_id),
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        secure=SESSION_SECURE,
        samesite=SAME_SITE,
        path="/",
    )


def clear_session_cookie(response: Response):
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")


def serialize_user(user: Dict) -> Dict:
    return {
        "id": user["id"],
        "provider": "linkedin",
        "name": user.get("name") or "",
        "email": user.get("email") or "",
        "picture": user.get("picture") or "",
        "createdAt": user.get("created_at"),
        "updatedAt": user.get("updated_at"),
    }


async def get_current_user(request: Request) -> Dict:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    user_id = read_session_token(token or "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


async def optional_current_user(request: Request) -> Optional[Dict]:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    user_id = read_session_token(token or "")
    return get_user_by_id(user_id) if user_id else None


CurrentUser = Depends(get_current_user)
