from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root first, then fall back to backend directory
# This allows .env to be in either location
project_root = Path(__file__).resolve().parent.parent
backend_dir = Path(__file__).resolve().parent
load_dotenv(project_root / ".env")  # Try root first
load_dotenv(backend_dir / ".env", override=False)  # Fall back to backend/.env if root doesn't exist

import os
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import router as api_router
from api.auth import router as auth_router
from api.resumes import router as resumes_router
from api.ai_tools import router as ai_router
from api.linkedin import router as linkedin_router
from core.db import init_db

app = FastAPI(title="Indexnine Resume Builder API", version="1.0.0")

def _cors_origins() -> List[str]:
    configured = os.getenv("CORS_ORIGINS", "")
    origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    frontend_url = os.getenv("FRONTEND_REDIRECT_URL")
    if frontend_url:
        origins.append(frontend_url.rstrip("/"))
    origins.extend(origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip())
    return sorted(set(origins))

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

# Include API routes
app.include_router(api_router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(resumes_router, prefix="/api/resumes", tags=["resumes"])
app.include_router(ai_router, prefix="/api/ai", tags=["ai"])
# LinkedIn OAuth: /api/linkedin/auth and /api/linkedin/callback
app.include_router(linkedin_router, prefix="/api/linkedin", tags=["linkedin"])

@app.get("/")
async def root():
    return {"message": "Indexnine Resume Builder API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Indexnine-resume-builder"}


def _get_routes():
    """Collect path + method for all routes (for debugging)."""
    out = []
    for r in app.routes:
        if hasattr(r, "path") and hasattr(r, "methods"):
            for m in r.methods:
                out.append(f"{m} {r.path}")
        elif hasattr(r, "path"):
            out.append(f"GET {r.path}")
    return sorted(out)


@app.get("/api/debug/routes")
async def debug_routes():
    """Return registered routes. Use to confirm you're hitting this app and that /api/linkedin/auth exists."""
    return {"app": "Indexnine Resume Builder API", "routes": _get_routes()}


@app.get("/api/linkedin/ok")
async def linkedin_ok():
    """Debug: if this returns {"ok": true}, the app is correct and /api/linkedin/auth should work too."""
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
