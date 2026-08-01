from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user
from core import db

router = APIRouter()


class ResumeCreate(BaseModel):
    title: str = "Untitled Resume"
    templateId: str = "indexnine"
    data: Dict[str, Any]


class ResumeUpdate(BaseModel):
    title: Optional[str] = None
    templateId: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class VersionCreate(BaseModel):
    label: str = ""


@router.get("")
async def list_user_resumes(user=Depends(get_current_user)):
    return db.list_resumes(user["id"])


@router.post("")
async def create_user_resume(body: ResumeCreate, user=Depends(get_current_user)):
    resume = db.create_resume(user["id"], body.title, body.templateId, body.data)
    return resume


@router.get("/{resume_id}")
async def read_user_resume(resume_id: int, user=Depends(get_current_user)):
    resume = db.get_resume(user["id"], resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.patch("/{resume_id}")
async def update_user_resume(resume_id: int, body: ResumeUpdate, user=Depends(get_current_user)):
    updates = body.model_dump(exclude_unset=True)
    resume = db.update_resume(user["id"], resume_id, updates)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.delete("/{resume_id}")
async def delete_user_resume(resume_id: int, user=Depends(get_current_user)):
    if not db.delete_resume(user["id"], resume_id):
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"ok": True}


@router.post("/{resume_id}/versions")
async def create_user_resume_version(resume_id: int, body: VersionCreate, user=Depends(get_current_user)):
    version = db.create_resume_version(user["id"], resume_id, body.label)
    if not version:
        raise HTTPException(status_code=404, detail="Resume not found")
    return version


@router.get("/{resume_id}/versions")
async def list_user_resume_versions(resume_id: int, user=Depends(get_current_user)):
    if not db.get_resume(user["id"], resume_id):
        raise HTTPException(status_code=404, detail="Resume not found")
    return db.list_resume_versions(user["id"], resume_id)


@router.post("/{resume_id}/versions/{version_id}/restore")
async def restore_user_resume_version(resume_id: int, version_id: int, user=Depends(get_current_user)):
    resume = db.restore_resume_version(user["id"], resume_id, version_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Version not found")
    return resume
