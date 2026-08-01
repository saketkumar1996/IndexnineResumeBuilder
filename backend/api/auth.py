from fastapi import APIRouter, Depends, Response

from core.auth import clear_session_cookie, get_current_user, serialize_user

router = APIRouter()


@router.get("/me")
async def auth_me(user=Depends(get_current_user)):
    return serialize_user(user)


@router.post("/logout")
async def auth_logout(response: Response):
    clear_session_cookie(response)
    return {"ok": True}
