# Environment setup

Accounts use email and password. Session cookies are signed with `SESSION_SECRET`.

## Quick start

1. **Copy the example env file**

   From the repo root:
   ```bash
   cp backend/.env.example backend/.env
   ```

   Or on Windows (PowerShell):
   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

2. **Edit `backend/.env`**

   For local development the example values are enough. Set a unique `SESSION_SECRET` if you want, and add `OPENAI_API_KEY` if you use AI extract.

3. **Run backend and frontend**

   Backend (loads `backend/.env` automatically):

   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   # or: uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   Frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Create an account**

   Open the app, choose **Create account**, enter name, email, and a password of at least 8 characters, then sign in.

5. **Use "Paste & extract with AI" (optional)**

   - Add `OPENAI_API_KEY` to `backend/.env` (from [OpenAI API keys](https://platform.openai.com/api-keys)).
   - Restart the backend.
   - Paste LinkedIn (or similar) profile text into the extract flow to fill experience, education, skills, and summary.

## Variables reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | Yes in production | Long random secret used to sign session cookies |
| `FRONTEND_REDIRECT_URL` | No | Frontend origin, also added to CORS (default: `http://localhost:3000`) |
| `OPENAI_API_KEY` | No* | OpenAI API key for "Paste & extract with AI". If missing, that feature returns 503. |

\*Required only for AI profile extract.

## Production setup

Render backend:

```env
DATABASE_URL=<Render Postgres internal/external URL>
SESSION_SECRET=<long random value>
SESSION_SECURE=true
SESSION_SAMESITE=none
CORS_ORIGINS=https://<your-vercel-app>.vercel.app
FRONTEND_REDIRECT_URL=https://<your-vercel-app>.vercel.app
OPENAI_API_KEY=<key>
AI_MODEL=gpt-4o-mini
```

Vercel frontend:

```env
VITE_API_BASE_URL=https://<your-render-api>.onrender.com
```

Additional production variables:

- `DATABASE_URL`: Render Postgres connection string. Local dev falls back to SQLite if omitted.
- `SESSION_SECRET`: long random secret used to sign app session cookies.
- `SESSION_SECURE=true`: required for HTTPS cookies in production.
- `SESSION_SAMESITE=none`: required when Vercel and Render are on different domains.
- `CORS_ORIGINS`: comma-separated allowed frontend origins, including the Vercel URL.
- `OPENAI_API_BASE`: optional OpenAI-compatible base URL.
- `AI_MODEL`: optional model override for SaaS AI endpoints.

## File locations

- **Backend env file**: `backend/.env`  
  The backend loads it via `python-dotenv` when `main.py` starts.  
  Never commit `backend/.env`; it is ignored by `.gitignore`.
- **Example file**: `backend/.env.example`  
  Safe to commit; copy to `backend/.env` and fill in real values.

## Troubleshooting

- **"Invalid email or password"**  
  The email is unknown or the password does not match. Create an account first from the **Create account** tab.

- **"An account with this email already exists"**  
  Sign in with that email instead of registering again.

- **"AI parse is not configured" or 503 on Paste & extract with AI**  
  Add `OPENAI_API_KEY` to `backend/.env` and restart the backend.
