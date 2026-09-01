import type { Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface SessionPayload {
  sub: string;
}

export const createSessionToken = (userId: string): string =>
  jwt.sign({ sub: userId } satisfies SessionPayload, env.sessionSecret, {
    expiresIn: env.sessionMaxAgeSeconds,
  });

export const readSessionToken = (token: string): string | null => {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.sessionSecret);
    if (typeof payload === "string" || !payload.sub) return null;
    return String(payload.sub);
  } catch {
    return null;
  }
};

export const setSessionCookie = (res: Response, userId: string): void => {
  res.cookie(env.sessionCookieName, createSessionToken(userId), {
    maxAge: env.sessionMaxAgeSeconds * 1000,
    httpOnly: true,
    secure: env.sessionSecure,
    sameSite: env.sessionSameSite,
    path: "/",
  });
};

export const clearSessionCookie = (res: Response): void => {
  res.clearCookie(env.sessionCookieName, {
    httpOnly: true,
    secure: env.sessionSecure,
    sameSite: env.sessionSameSite,
    path: "/",
  });
};
