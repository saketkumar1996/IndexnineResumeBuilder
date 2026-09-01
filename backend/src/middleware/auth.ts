import type { NextFunction, Request, RequestHandler, Response } from "express";
import { env } from "../config/env";
import { User, type UserDocument } from "../models/User";
import { readSessionToken } from "../services/session";
import { unauthorized } from "./httpError";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

const userFromRequest = async (req: Request): Promise<UserDocument | null> => {
  const token = req.cookies?.[env.sessionCookieName];
  const userId = readSessionToken(typeof token === "string" ? token : "");
  if (!userId) return null;
  try {
    return await User.findById(userId);
  } catch {
    return null;
  }
};

export const requireAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  userFromRequest(req)
    .then((user) => {
      if (!user) {
        next(unauthorized());
        return;
      }
      req.user = user;
      next();
    })
    .catch(next);
};

/** Returns the authenticated user, or null. Never throws. */
export const optionalAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  userFromRequest(req)
    .then((user) => {
      if (user) req.user = user;
      next();
    })
    .catch(() => next());
};

/** Non-null accessor for handlers mounted behind requireAuth. */
export const currentUser = (req: Request): UserDocument => {
  if (!req.user) throw unauthorized();
  return req.user;
};
