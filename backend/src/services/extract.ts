import mammoth from "mammoth";
// The package entrypoint runs a debug branch that reads a local test file, so import
// the library module directly.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { badRequest } from "../middleware/httpError";

export const extractTextFromPdf = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await pdfParse(buffer);
    return result.text || "";
  } catch (error) {
    throw badRequest(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const extractTextFromDocx = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    throw badRequest(
      `Failed to extract text from DOCX: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
