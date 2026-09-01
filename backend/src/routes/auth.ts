import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "../middleware/errorHandler";
import { badRequest, conflict, HttpError } from "../middleware/httpError";
import { currentUser, requireAuth } from "../middleware/auth";
import { User } from "../models/User";
import {
  PASSWORD_MIN_LENGTH,
  hashPassword,
  isValidEmail,
  normalizeEmail,
  verifyPassword,
} from "../services/passwords";
import { clearSessionCookie, setSessionCookie } from "../services/session";

const router = Router();

const registerSchema = z.object({
  name: z.string().optional().default(""),
  email: z.string(),
  password: z.string(),
});

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const validatedEmail = (email: string): string => {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw badRequest("Enter a valid email address.");
  }
  return normalized;
};

const validatedPassword = (password: string): string => {
  if ((password || "").length < PASSWORD_MIN_LENGTH) {
    throw badRequest(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  return password;
};

const parseBody = <S extends z.ZodTypeAny>(schema: S, body: unknown): z.infer<S> => {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    throw badRequest(result.error.issues[0]?.message || "Invalid request body");
  }
  return result.data;
};

const DUPLICATE_EMAIL = "An account with this email already exists.";

router.post(
  "/register",
  asyncRoute(async (req, res) => {
    const body = parseBody(registerSchema, req.body);
    const email = validatedEmail(body.email);
    const password = validatedPassword(body.password);
    const name = (body.name || "").trim() || email.split("@")[0];

    if (await User.exists({ email })) {
      throw conflict(DUPLICATE_EMAIL);
    }

    let user;
    try {
      user = await User.create({
        name,
        email,
        passwordHash: await hashPassword(password),
        picture: "",
        provider: "local",
      });
    } catch (error) {
      // The unique index is the authority; a concurrent register lands here.
      if (typeof error === "object" && error !== null && (error as { code?: number }).code === 11000) {
        throw conflict(DUPLICATE_EMAIL);
      }
      throw error;
    }

    setSessionCookie(res, user._id.toString());
    res.json(user.toApiJSON());
  })
);

router.post(
  "/login",
  asyncRoute(async (req, res) => {
    const body = parseBody(loginSchema, req.body);
    const email = validatedEmail(body.email);
    const user = await User.findOne({ email });
    const storedHash = user?.passwordHash || "";

    if (!user || !storedHash || !(await verifyPassword(body.password, storedHash))) {
      throw new HttpError(401, "Invalid email or password.");
    }

    setSessionCookie(res, user._id.toString());
    res.json(user.toApiJSON());
  })
);

router.get(
  "/me",
  requireAuth,
  asyncRoute(async (req, res) => {
    res.json(currentUser(req).toApiJSON());
  })
);

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

export default router;
