import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../backend/src/app";
import { assertSessionSecretIsSafe } from "../backend/src/config/env";
import { connectDb } from "../backend/src/db/connect";

const app = createApp();

const headerValue = (req: IncomingMessage, name: string): string => {
  const value = req.headers[name];
  return typeof value === "string" ? value : "";
};

/**
 * vercel.json rewrites /api/:path* onto /api so this file is invoked. Restore the
 * public path Express is mounted on, or every route except a bare /api 404s.
 */
const restoreUrl = (req: IncomingMessage): void => {
  const invokePath = headerValue(req, "x-invoke-path") || headerValue(req, "x-forwarded-uri");
  if (invokePath.startsWith("/")) {
    const queryIndex = (req.url || "").indexOf("?");
    const query = queryIndex >= 0 && !invokePath.includes("?") ? (req.url || "").slice(queryIndex) : "";
    req.url = `${invokePath}${query}`;
    return;
  }

  const current = req.url || "/";
  const queryIndex = current.indexOf("?");
  const pathname = queryIndex >= 0 ? current.slice(0, queryIndex) : current;
  const search = queryIndex >= 0 ? current.slice(queryIndex + 1) : "";
  if (pathname !== "/api" && pathname !== "/api/") return;

  const params = new URLSearchParams(search);
  const pathParam = params.getAll("path").filter(Boolean).join("/");
  if (!pathParam) return;
  params.delete("path");
  const rest = params.toString();
  const suffix = pathParam.startsWith("/") ? pathParam : `/${pathParam}`;
  req.url = `/api${suffix}${rest ? `?${rest}` : ""}`;
};

const requestPath = (req: IncomingMessage): string => (req.url || "").split("?")[0];

const isHealthCheck = (req: IncomingMessage): boolean => {
  const path = requestPath(req);
  return path === "/health" || path === "/api/health" || path === "/api" || path === "/api/";
};

export const config = {
  api: {
    // Express and multer parse the body. If Vercel consumes it first, uploads break.
    bodyParser: false,
  },
  // Fluid Compute on Hobby allows this; AI parse and Atlas cold starts need more than 10s.
  maxDuration: 60,
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  restoreUrl(req);
  if (!isHealthCheck(req)) {
    assertSessionSecretIsSafe();
    await connectDb();
  }
  app(req, res);
}
