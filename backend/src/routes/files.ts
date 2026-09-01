import { Router } from "express";
import { env } from "../config/env";
import { asyncRoute } from "../middleware/errorHandler";
import { badGateway, badRequest, HttpError, serviceUnavailable } from "../middleware/httpError";
import { uploadSingleFile } from "../middleware/upload";
import { writeAiOutputLog } from "../services/aiLog";
import { filenameFromResume, generateDocxBuffer } from "../services/docx";
import { extractTextFromDocx, extractTextFromPdf } from "../services/extract";
import { normalizeUploadedResumeData } from "../services/normalize";
import { completeJson, truncate } from "../services/openai";
import { RESUME_SCHEMA_PROMPT } from "../services/prompts";

const router = Router();

const UPLOAD_AI_UNAVAILABLE = "AI parse is not configured. Set OPENAI_API_KEY in backend/.env";

router.post(
  "/upload-resume",
  uploadSingleFile,
  asyncRoute(async (req, res) => {
    const file = req.file;
    if (!file || !file.originalname) {
      throw badRequest("No file provided");
    }

    const uploadFilename = file.originalname;
    const extension = uploadFilename.toLowerCase().split(".").pop() || "";
    if (extension !== "pdf" && extension !== "docx") {
      throw badRequest("Invalid file type. Please upload a PDF or DOCX file.");
    }

    if (!env.openaiApiKey) {
      throw serviceUnavailable(UPLOAD_AI_UNAVAILABLE);
    }

    const extractedText =
      extension === "pdf" ? await extractTextFromPdf(file.buffer) : await extractTextFromDocx(file.buffer);

    if (!extractedText.trim()) {
      throw badRequest(
        "Could not extract text from the uploaded file. Please ensure the file contains readable text."
      );
    }

    let parsed: unknown;
    let raw = "";
    try {
      const completion = await completeJson({
        systemPrompt: RESUME_SCHEMA_PROMPT,
        userPrompt: truncate(extractedText.trim()),
        model: env.uploadParseModel,
        temperature: 0.2,
        unavailableMessage: UPLOAD_AI_UNAVAILABLE,
      });
      parsed = completion.data;
      raw = completion.raw;
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.status === 502) {
          await writeAiOutputLog({
            uploadFilename,
            rawAiResponse: raw,
            error: typeof error.detail === "string" ? error.detail : error.message,
          });
        }
        throw error;
      }
      throw badGateway(
        `Failed to process resume: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    const data = normalizeUploadedResumeData(parsed);

    await writeAiOutputLog({
      uploadFilename,
      rawAiResponse: raw,
      parsedData: parsed,
      returnedData: data,
    });

    res.json(data);
  })
);

router.post(
  "/export/docx",
  asyncRoute(async (req, res) => {
    const resumeData = req.body ?? {};
    const buffer = await generateDocxBuffer(resumeData);
    const filename = filenameFromResume(resumeData, "docx");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(buffer);
  })
);

export default router;
