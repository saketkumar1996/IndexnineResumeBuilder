# Environment setup

Accounts use email and password. Session cookies carry a JWT signed with
`SESSION_SECRET`.

## Prerequisites

- Node.js 20 or newer
- A MongoDB instance. Any of these works:
  - Local install, then `mongod --dbpath <path>`
  - Docker: `docker run -d -p 27017:27017 --name indexnine-mongo mongo:7`
  - A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

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

   Set `MONGODB_URI` to your instance. The example value points at a local
   `mongod`. Set a unique `SESSION_SECRET` if you want, and add `OPENAI_API_KEY`
   if you use AI extract or the AI tools.

3. **Run backend and frontend**

   Backend (loads `backend/.env` automatically):

   ```bash
   cd backend
   npm install
   npm run dev
   # or: npm run build && npm start
   ```

   Frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Create an account**

   Open the app, choose **Create account**, enter name, email, and a password of at least 8 characters, then sign in.

5. **Use resume import and AI tools (optional)**

   - Add `OPENAI_API_KEY` to `backend/.env` (from [OpenAI API keys](https://platform.openai.com/api-keys)).
   - Restart the backend.
   - Upload a PDF or DOCX resume to fill experience, education, skills, and summary, or use job match, bullet rewriting, and cover letters.

## Variables reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string (local or Atlas SRV URI) |
| `PORT` | No | API port (default: `8000`) |
| `SESSION_SECRET` | Yes in production | Long random secret used to sign session cookies |
| `FRONTEND_REDIRECT_URL` | No | Frontend origin, also added to CORS (default: `http://localhost:3000`) |
| `OPENAI_API_KEY` | No* | OpenAI-compatible API key. If missing, AI features return 503. |

\*Required only for resume import and the AI tools.

## Production setup

Vercel hosts the SPA and the Express API on the same origin. Leave
`VITE_API_BASE_URL` unset so the browser calls `/api` on the Vercel hostname.

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/indexnine_resume_builder
SESSION_SECRET=<long random value>
SESSION_SECURE=true
SESSION_SAMESITE=lax
CORS_ORIGINS=https://<your-app>.vercel.app
FRONTEND_REDIRECT_URL=https://<your-app>.vercel.app
OPENAI_API_KEY=<key>
AI_MODEL=gpt-4o-mini
```

Do not set `VITE_API_BASE_URL` for this layout. A leftover Render URL would send
auth cookies to the wrong host.

Additional production variables:

- `MONGODB_URI`: MongoDB Atlas connection string. Allow Vercel (or `0.0.0.0/0`
  on the free tier) in the Atlas network access list.
- `SESSION_SECRET`: long random secret used to sign app session cookies. The API
  refuses to start if this is still the example default while `SESSION_SECURE=true`,
  the process is on Vercel, or a remote `MONGODB_URI` is configured.
- `SESSION_SECURE=true`: required for HTTPS cookies in production. On Vercel this
  defaults to true when unset.
- `SESSION_SAMESITE=lax`: correct when the SPA and `/api` share a Vercel domain.
  Use `none` only if the API is on a different site.
- `CORS_ORIGINS`: comma-separated allowed frontend origins (the Vercel URL).
- `SESSION_COOKIE_NAME`: optional cookie name override (default `indexnine_session`).
- `SESSION_MAX_AGE_SECONDS`: optional session lifetime (default 14 days).
- `OPENAI_API_BASE`: optional OpenAI-compatible base URL (default OpenRouter).
- `AI_MODEL`: optional model override for the AI endpoints.

## File locations

- **Backend env file**: `backend/.env`
  The backend loads it via `dotenv` when the server starts. A `.env` in the repo
  root is loaded first and takes precedence.
  Never commit `backend/.env`; it is ignored by `.gitignore`.
- **Example file**: `backend/.env.example`
  Safe to commit; copy to `backend/.env` and fill in real values.

## Troubleshooting

- **"MONGODB_URI is not set"**
  Copy `backend/.env.example` to `backend/.env` and set a connection string.

- **Server exits with a MongoDB timeout**
  The database is unreachable. Check that `mongod` is running, or that your Atlas
  IP access list includes your address.

- **"Invalid email or password."**
  The email is unknown or the password does not match. Create an account first from the **Create account** tab.

- **"An account with this email already exists."**
  Sign in with that email instead of registering again.

- **"AI is not configured" or 503 on AI features**
  Add `OPENAI_API_KEY` to `backend/.env` and restart the backend.

- **Session refuses to start in production**
  `SESSION_SECRET` is still `dev-indexnine-change-me`. Set a long random value.
