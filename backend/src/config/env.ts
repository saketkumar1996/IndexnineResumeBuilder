import path from "path";
import dotenv from "dotenv";

// dotenv never overwrites an existing key, so the root .env wins and backend/.env
// only fills the gaps.
const backendDir = path.resolve(__dirname, "..", "..");
const projectRoot = path.resolve(backendDir, "..");

dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config({ path: path.join(backendDir, ".env") });

const DEFAULT_SESSION_SECRET = "dev-indexnine-change-me";
const LOCAL_MONGODB_URI = "mongodb://127.0.0.1:27017/indexnine_resume_builder";

const str = (key: string, fallback = ""): string => (process.env[key] ?? fallback).trim();
const bool = (key: string, fallback = false): boolean => {
  const raw = str(key);
  return raw ? raw.toLowerCase() === "true" : fallback;
};
const int = (key: string, fallback: number): number => {
  const parsed = Number.parseInt(str(key), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sameSite = (): "lax" | "strict" | "none" => {
  const raw = str("SESSION_SAMESITE", "lax").toLowerCase();
  return raw === "strict" || raw === "none" ? raw : "lax";
};

const onVercel = str("VERCEL") === "1";

const vercelHttpsOrigin = (host: string): string | null => {
  const trimmed = host.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, "");
  return `https://${trimmed}`;
};

export const env = {
  port: int("PORT", 8000),
  nodeEnv: str("NODE_ENV", "development"),
  // Vercel functions cannot reach a developer's localhost MongoDB. Fail fast
  // unless MONGODB_URI is set on the project instead of hanging on 127.0.0.1.
  mongodbUri: str("MONGODB_URI", onVercel ? "" : LOCAL_MONGODB_URI),

  sessionCookieName: str("SESSION_COOKIE_NAME", "indexnine_session"),
  sessionSecret: str("SESSION_SECRET") || str("SECRET_KEY") || DEFAULT_SESSION_SECRET,
  sessionMaxAgeSeconds: int("SESSION_MAX_AGE_SECONDS", 60 * 60 * 24 * 14),
  sessionSecure: bool("SESSION_SECURE", onVercel),
  sessionSameSite: sameSite(),

  corsOrigins: str("CORS_ORIGINS"),
  frontendRedirectUrl: str("FRONTEND_REDIRECT_URL"),

  openaiApiKey: str("OPENAI_API_KEY"),
  openaiApiBase: str("OPENAI_API_BASE", "https://openrouter.ai/api/v1"),
  aiModel: str("AI_MODEL", "gpt-4o-mini"),
  uploadParseModel: str("UPLOAD_PARSE_MODEL", "gpt-4o-mini"),
  aiOutputLogDir: str("AI_OUTPUT_LOG_DIR", path.join(backendDir, "ai_output_logs")),
};

/**
 * A configured MONGODB_URI that is not localhost, or SESSION_SECURE=true, are the
 * signals this project's deployment docs use to mean "production". Serving traffic
 * there with the publicly known example secret would let anyone forge a session for
 * any user id, so refuse to start instead.
 */
export const assertSessionSecretIsSafe = (): void => {
  const looksRemote = Boolean(env.mongodbUri) && !/(localhost|127\.0\.0\.1)/.test(env.mongodbUri);
  if (env.sessionSecret === DEFAULT_SESSION_SECRET && (env.sessionSecure || looksRemote || onVercel)) {
    throw new Error(
      "SESSION_SECRET is not set (or still the default 'dev-indexnine-change-me') while " +
        "SESSION_SECURE=true, Vercel is hosting the API, or a remote MONGODB_URI is configured. " +
        "Set SESSION_SECRET to a long random value before starting the app."
    );
  }
};

export const corsOriginList = (): string[] => {
  const origins = new Set([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);
  if (env.frontendRedirectUrl) {
    origins.add(env.frontendRedirectUrl.replace(/\/$/, ""));
  }
  for (const origin of env.corsOrigins.split(",")) {
    const trimmed = origin.trim().replace(/\/$/, "");
    if (trimmed) origins.add(trimmed);
  }
  // Same-origin /api calls do not need CORS; these cover a leftover absolute API URL.
  for (const host of [str("VERCEL_URL"), str("VERCEL_PROJECT_PRODUCTION_URL")]) {
    const origin = vercelHttpsOrigin(host);
    if (origin) origins.add(origin);
  }
  return [...origins].sort();
};
