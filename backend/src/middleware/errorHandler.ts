import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import multer from "multer";
import { HttpError } from "./httpError";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Express 5 forwards rejected promises on its own, but wrapping keeps the behaviour
 * explicit and identical if the app is ever run on Express 4.
 */
export const asyncRoute = (handler: AsyncHandler): RequestHandler => (req, res, next) => {
  handler(req, res, next).catch(next);
};

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ detail: "Not Found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ detail: err.detail });
    return;
  }

  if (err instanceof multer.MulterError) {
    res.status(400).json({ detail: `Upload failed: ${err.message}` });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ detail: "Malformed JSON body" });
    return;
  }

  const message = err instanceof Error ? err.message : String(err);
  console.error("[error]", message, err instanceof Error ? err.stack : "");
  res.status(500).json({ detail: `Internal server error: ${message}` });
};
