import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { currentUser, requireAuth } from "../middleware/auth";
import { asyncRoute } from "../middleware/errorHandler";
import { badGateway, badRequest } from "../middleware/httpError";
import { CoverLetter } from "../models/CoverLetter";
import { Resume } from "../models/Resume";
import { resumeText } from "../services/normalize";
import { completeJson, truncate } from "../services/openai";
import { COVER_LETTER_SYSTEM, IMPROVE_BULLET_SYSTEM, JOB_MATCH_SYSTEM } from "../services/prompts";

const router = Router();

router.use(requireAuth);

const AI_UNAVAILABLE = "AI is not configured. Set OPENAI_API_KEY.";

const resumeDataSchema = z.record(z.unknown());

const jobMatchSchema = z.object({
  resumeData: resumeDataSchema.default({}),
  jobDescription: z.string().default(""),
});

const improveBulletSchema = z.object({
  bullet: z.string().default(""),
  context: z.string().optional().default(""),
  tone: z.string().optional().default("impact"),
  jobDescription: z.string().optional().default(""),
  resumeData: resumeDataSchema.optional(),
});

const coverLetterSchema = z.object({
  resumeId: z.union([z.string(), z.number()]).optional(),
  resumeData: resumeDataSchema.default({}),
  jobDescription: z.string().default(""),
});

const parseBody = <S extends z.ZodTypeAny>(schema: S, bodyValue: unknown): z.infer<S> => {
  const result = schema.safeParse(bodyValue ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    throw badRequest(`Invalid ${issue?.path.join(".") || "body"}: ${issue?.message || "unexpected value"}`);
  }
  return result.data;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item ?? "")).filter(Boolean) : [];

router.post(
  "/job-match",
  asyncRoute(async (req, res) => {
    const body = parseBody(jobMatchSchema, req.body);
    if (!body.jobDescription.trim()) {
      throw badRequest("Job description is required");
    }

    const { data } = await completeJson({
      systemPrompt: JOB_MATCH_SYSTEM,
      userPrompt: `Resume:\n${truncate(resumeText(body.resumeData))}\n\nJob description:\n${truncate(
        body.jobDescription
      )}`,
      unavailableMessage: AI_UNAVAILABLE,
    });

    const result = isRecord(data) ? data : {};
    const score = result.score ?? result.matchScore ?? 0;

    res.json({
      matchScore: Number(score) || 0,
      missingKeywords: stringList(result.missingKeywords),
      strengths: stringList(result.strengths),
      risks: stringList(result.risks),
      sectionSuggestions: isRecord(result.sectionSuggestions) ? result.sectionSuggestions : {},
    });
  })
);

router.post(
  "/improve-bullet",
  asyncRoute(async (req, res) => {
    const body = parseBody(improveBulletSchema, req.body);
    if (!body.bullet.trim()) {
      throw badRequest("Bullet is required");
    }

    const context = body.context || resumeText(body.resumeData || {});
    const { data } = await completeJson({
      systemPrompt: IMPROVE_BULLET_SYSTEM,
      userPrompt:
        `Bullet: ${body.bullet}\n` +
        `Context: ${context}\n` +
        `Job description: ${body.jobDescription || ""}\n` +
        `Tone: ${body.tone || "impact"}`,
      unavailableMessage: AI_UNAVAILABLE,
    });

    const options = isRecord(data) && Array.isArray(data.options) ? data.options : [];
    if (!options.length) {
      throw badGateway("AI returned no bullet options");
    }

    res.json({ options: options.slice(0, 3) });
  })
);

router.post(
  "/cover-letter",
  asyncRoute(async (req, res) => {
    const user = currentUser(req);
    const body = parseBody(coverLetterSchema, req.body);
    if (!body.jobDescription.trim()) {
      throw badRequest("Job description is required");
    }

    const { data } = await completeJson({
      systemPrompt: COVER_LETTER_SYSTEM,
      userPrompt: `Resume:\n${truncate(resumeText(body.resumeData))}\n\nJob description:\n${truncate(
        body.jobDescription
      )}`,
      unavailableMessage: AI_UNAVAILABLE,
    });

    const content = isRecord(data) ? String(data.content || "") : "";
    if (!content) {
      throw badGateway("AI returned an empty cover letter");
    }

    let saved = null;
    const resumeId = body.resumeId ? String(body.resumeId) : "";
    if (resumeId && Types.ObjectId.isValid(resumeId)) {
      const resume = await Resume.findOne({ _id: resumeId, userId: user._id }).select("_id");
      if (resume) {
        const letter = await CoverLetter.create({
          resumeId: resume._id,
          userId: user._id,
          jobDescription: body.jobDescription,
          content,
        });
        saved = letter.toApiJSON();
      }
    }

    res.json({ content, saved: Boolean(saved), coverLetter: saved });
  })
);

export default router;
