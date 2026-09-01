import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { corsOriginList } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import aiRouter from "./routes/ai";
import authRouter from "./routes/auth";
import filesRouter from "./routes/files";
import resumesRouter from "./routes/resumes";

export const createApp = (): Express => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: corsOriginList(),
      credentials: true,
    })
  );

  // Resume payloads carry every bullet and a pasted job description, so the 100kb
  // Express default is too tight.
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());

  app.get("/", (_req, res) => {
    res.json({ message: "Indexnine Resume Builder API" });
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "Indexnine-resume-builder" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/resumes", resumesRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api", filesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
