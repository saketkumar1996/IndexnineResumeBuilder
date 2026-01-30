from pathlib import Path

from dotenv import load_dotenv

# Load .env from the backend directory so it works when run from project root or backend/
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import router as api_router
from api.linkedin import router as linkedin_router

app = FastAPI(title="Indexnine Resume Builder API", version="1.0.0")

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")
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