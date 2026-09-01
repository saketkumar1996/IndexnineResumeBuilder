import multer from "multer";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Uploaded resumes are parsed in-process and never persisted, so keep them in memory.
 */
export const uploadSingleFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
}).single("file");
