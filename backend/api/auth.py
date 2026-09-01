from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from core.auth import clear_session_cookie, get_current_user, serialize_user, set_session_cookie
from core.db import create_local_user, get_user_by_email
from core.passwords import PASSWORD_MIN_LENGTH, hash_password, is_valid_email, normalize_email, verify_password

router = APIRouter()


class RegisterRequest(BaseModel):
    name: str = ""
    email: str
    password: str = Field(min_length=1)


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1)


def _validated_email(email: str) -> str:
    normalized = normalize_email(email)
    if not is_valid_email(normalized):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    return normalized


def _validated_password(password: str) -> str:
    if len(password) < PASSWORD_MIN_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {PASSWORD_MIN_LENGTH} characters.",
        )
    return password


@router.post("/register")
async def auth_register(body: RegisterRequest, response: Response):
    email = _validated_email(body.email)
    password = _validated_password(body.password)
    try:
        user = create_local_user(body.name, email, hash_password(password))
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    set_session_cookie(response, int(user["id"]))
    return serialize_user(user)


@router.post("/login")
async def auth_login(body: LoginRequest, response: Response):
    email = _validated_email(body.email)
    user = get_user_by_email(email)
    stored_hash = (user or {}).get("password_hash") or ""
    if not user or not stored_hash or not verify_password(body.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    set_session_cookie(response, int(user["id"]))
    return serialize_user(user)


@router.get("/me")
async def auth_me(user=Depends(get_current_user)):
    return serialize_user(user)


@router.post("/logout")
async def auth_logout(response: Response):
    clear_session_cookie(response)
    return {"ok": True}
