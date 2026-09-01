import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../backend/src/app";
import { assertSessionSecretIsSafe } from "../backend/src/config/env";
import { connectDb } from "../backend/src/db/connect";

const app = createApp();

const requestPath = (req: IncomingMessage): string => (req.url || "").split("?")[0];

const isHealthCheck = (req: IncomingMessage): boolean => {
  const path = requestPath(req);
  return path === "/health" || path === "/api/health";
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
  if (!isHealthCheck(req)) {
    assertSessionSecretIsSafe();
    await connectDb();
  }
  app(req, res);
}
