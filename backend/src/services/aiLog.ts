import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";

const safeLogFilename = (filename: string): string => {
  const safe = (filename || "").replace(/[^A-Za-z0-9_.-]+/g, "_").replace(/^[._]+|[._]+$/g, "") || "resume";
  return safe.slice(0, 80);
};

export interface AiOutputLog {
  uploadFilename: string;
  rawAiResponse: string;
  parsedData?: unknown;
  returnedData?: unknown;
  error?: string;
}

/**
 * Writes the upload AI output for local debugging. Best effort only: the folder is
 * gitignored and a logging failure must never fail the request.
 */
export const writeAiOutputLog = async (entry: AiOutputLog): Promise<string | null> => {
  try {
    await fs.mkdir(env.aiOutputLogDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const logPath = path.join(env.aiOutputLogDir, `${timestamp}_${safeLogFilename(entry.uploadFilename)}.json`);
    await fs.writeFile(
      logPath,
      JSON.stringify(
        {
          timestamp,
          uploadFilename: entry.uploadFilename,
          rawAiResponse: entry.rawAiResponse,
          parsedData: entry.parsedData ?? null,
          returnedData: entry.returnedData ?? null,
          error: entry.error ?? null,
        },
        null,
        2
      ),
      "utf-8"
    );
    return logPath;
  } catch {
    return null;
  }
};
