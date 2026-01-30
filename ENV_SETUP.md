# Environment setup

This project uses environment variables for LinkedIn OAuth (automatic “Extract from LinkedIn”).

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

2. **Get LinkedIn credentials**

   - Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) and sign in.
   - Click **Create app** (or use an existing app).
   - Fill in app name, LinkedIn Page (create/choose a company page if needed), and accept the terms.
   - In the app:
     - **Auth** tab → **Application credentials** → copy **Client ID** and **Client Secret**.
     - **Auth** tab → **OAuth 2.0 settings** → under **Authorized redirect URLs** click **Add redirect URL** and add:
       - `http://localhost:8000/api/linkedin/callback` (for local backend on port 8000).
     - **Products** tab → request **Sign In with LinkedIn using OpenID Connect** (or the product that gives `r_liteprofile` and `r_emailaddress`) if required by your app type.

3. **Edit `backend/.env`**

   Open `backend/.env` and set:

   ```env
   LINKEDIN_CLIENT_ID=<paste your Client ID>
   LINKEDIN_CLIENT_SECRET=<paste your Client Secret>
   LINKEDIN_REDIRECT_URI=http://localhost:8000/api/linkedin/callback
   FRONTEND_REDIRECT_URL=http://localhost:3000
   ```

   - Use `http://localhost:8000/api/linkedin/callback` if your API runs on port 8000.
   - Use `http://localhost:3000` if your frontend runs on port 3000; change if you use another port.

4. **Run backend and frontend**

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

5. **Use “Extract from LinkedIn”**

   In the app, click **Extract from LinkedIn**. You’ll be sent to LinkedIn to authorize; after approving, you’re redirected back and the resume form is filled from your profile (name and email; LinkedIn OpenID only provides basic profile).

6. **Use "Paste & extract with AI" (full profile)**

   To fill experience, education, skills, summary, etc., use **Paste & extract with AI**:
   - Add `OPENAI_API_KEY` to `backend/.env` (from [OpenAI API keys](https://platform.openai.com/api-keys)).
   - Restart the backend.
   - In the app, click **Paste & extract with AI**, paste your full LinkedIn profile text (About, Experience, Education, Skills, etc.), then click **Extract with AI**. The AI will parse the text and merge the result into the form. You can use this after "Extract from LinkedIn" to add full details on top of name/email.

## Variables reference

| Variable | Required | Description |
|----------|----------|-------------|
| `LINKEDIN_CLIENT_ID` | Yes* | LinkedIn app Client ID |
| `LINKEDIN_CLIENT_SECRET` | Yes* | LinkedIn app Client Secret |
| `LINKEDIN_REDIRECT_URI` | Yes* | Exact redirect URL configured in the LinkedIn app (e.g. `http://localhost:8000/api/linkedin/callback`) |
| `FRONTEND_REDIRECT_URL` | No | URL of the frontend app where users land after LinkedIn login (default: `http://localhost:3000`) |
| `OPENAI_API_KEY` | Yes** | OpenAI API key for "Paste & extract with AI". If missing, that feature returns 503. |

\*Required for the “Extract from LinkedIn” feature. \**Required for "Paste & extract with AI".

## File locations

- **Backend env file**: `backend/.env`  
  The backend loads it via `python-dotenv` when `main.py` starts.  
  Never commit `backend/.env`; it is ignored by `.gitignore`.
- **Example file**: `backend/.env.example`  
  Safe to commit; copy to `backend/.env` and fill in real values.

## Troubleshooting

- **“LinkedIn OAuth is not configured”**  
  Ensure `backend/.env` exists, contains `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, and `LINKEDIN_REDIRECT_URI`, and that you started the backend after editing `.env`.

- **Redirect URI / redirect_uri mismatch**  
  The value of `LINKEDIN_REDIRECT_URI` must match exactly (including `http` vs `https`, trailing slash, and port) one of the “Authorized redirect URLs” in the LinkedIn app.

- **“Failed to obtain LinkedIn access token”**  
  Usually wrong client secret or redirect URI. Double-check Client ID/Secret and redirect URL in the LinkedIn app and in `backend/.env`.

- **"AI parse is not configured" or 503 on Paste & extract with AI**  
  Add `OPENAI_API_KEY` to `backend/.env` (from [OpenAI API keys](https://platform.openai.com/api-keys)) and restart the backend.
