import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { currentUser, requireAuth } from "../middleware/auth";
import { asyncRoute } from "../middleware/errorHandler";
import { badRequest, notFound } from "../middleware/httpError";
import { Resume } from "../models/Resume";
import { ResumeVersion } from "../models/ResumeVersion";
import type { LooseResumeData } from "../types/resume";

const router = Router();

router.use(requireAuth);

const resumeDataSchema = z.record(z.unknown());

const createSchema = z.object({
  title: z.string().optional(),
  templateId: z.string().optional(),
  data: resumeDataSchema,
});

const updateSchema = z.object({
  title: z.string().optional(),
  templateId: z.string().optional(),
  template_id: z.string().optional(),
  data: resumeDataSchema.optional(),
});

const versionSchema = z.object({
  label: z.string().optional(),
});

const parseBody = <S extends z.ZodTypeAny>(schema: S, body: unknown): z.infer<S> => {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join(".") || "body";
    throw badRequest(`Invalid ${field}: ${issue?.message || "unexpected value"}`);
  }
  return result.data;
};

/** An unparseable id can never match a document, so treat it as a miss, not a crash. */
const objectId = (value: string | string[] | undefined, label: string): Types.ObjectId => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !Types.ObjectId.isValid(raw)) {
    throw notFound(`${label} not found`);
  }
  return new Types.ObjectId(raw);
};

router.get(
  "",
  asyncRoute(async (req, res) => {
    const user = currentUser(req);
    const resumes = await Resume.find({ userId: user._id }).sort({ updatedAt: -1 });
    res.json(resumes.map((resume) => resume.toApiJSON()));
  })
);

router.post(
  "",
  asyncRoute(async (req, res) => {
    const user = currentUser(req);
    const body = parseBody(createSchema, req.body);
    const resume = await Resume.create({
      userId: user._id,
      title: body.title || "Untitled Resume",
      templateId: body.templateId || "indexnine",
      data: body.data as LooseResumeData,
    });
    res.json(resume.toApiJSON());
  })
);

router.get(
  "/:resumeId",
  asyncRoute(async (req, res) => {
    const user = currentUser(req);
    const resume = await Resume.findOne({
      _id: objectId(req.params.resumeId, "Resume"),
      userId: user._id,
    });
    if (!resume) throw notFound("Resume not found");
    res.json(resume.toApiJSON());
  })
);

router.patch(
  "/:resumeId",
  asyncRoute(async (req, res) => {
    const user = currentUser(req);
    const body = parseBody(updateSchema, req.body);
    const resume = await Resume.findOne({
      _id: objectId(req.params.resumeId, "Resume"),
      userId: user._id,
    });
    if (!resume) throw notFound("Resume not found");

    if (body.title !== undefined) resume.title = body.title;
    const templateId = body.templateId ?? body.template_id;
    if (templateId !== undefined) resume.templateId = templateId;
    if (body.data !== undefined) {
      resume.data = body.data as LooseResumeData;
      // `data` is a Mixed path, so Mongoose needs to be told it changed.
      resume.markModified("data");
    }

    await resume.save();
    res.json(resume.toApiJSON());
  })
);

router.delete(
  "/:resumeId",
  asyncRoute(async (req, res) => {
    const user = currentUser(req);
    const resumeId = objectId(req.params.resumeId, "Resume");
    const deleted = await Resume.findOneAndDelete({ _id: resumeId, userId: user._id });
    if (!deleted) throw notFound("Resume not found");
    await ResumeVersion.deleteMany({ resumeId, userId: user._id });
    res.json({ ok: true });
  })
);

router.post(
  "/:resumeId/versions",
  asyncRoute(async (req, res) => {
    const user = currentUser(req);
    const body = parseBody(versionSchema, req.body);
    const resumeId = objectId(req.params.resumeId, "Resume");
    const resume = await Resume.findOne({ _id: resumeId, userId: user._id });
    if (!resume) throw notFound("Resume not found");

    const latest = await ResumeVersion.findOne({ resumeId, userId: user._id })
      .sort({ versionNumber: -1 })
      .select("versionNumber");
    const versionNumber = (latest?.versionNumber || 0) + 1;

    const version = await ResumeVersion.create({
      resumeId,
      userId: user._id,
      versionNumber,
      label: body.label || `Version ${versionNumber}`,
      data: resume.data,
    });
    res.json(version.toApiJSON());
  })
);

router.get(
  "/:resumeId/versions",
  asyncRoute(async (req, res) => {
    const user = currentUser(req);
    const resumeId = objectId(req.params.resumeId, "Resume");
    if (!(await Resume.exists({ _id: resumeId, userId: user._id }))) {
      throw notFound("Resume not found");
    }
    const versions = await ResumeVersion.find({ resumeId, userId: user._id }).sort({ versionNumber: -1 });
    res.json(versions.map((version) => version.toApiJSON()));
  })
);

router.post(
  "/:resumeId/versions/:versionId/restore",
  asyncRoute(async (req, res) => {
    const user = currentUser(req);
    const resumeId = objectId(req.params.resumeId, "Resume");
    const versionId = objectId(req.params.versionId, "Version");

    const version = await ResumeVersion.findOne({ _id: versionId, resumeId, userId: user._id });
    if (!version) throw notFound("Version not found");

    const resume = await Resume.findOne({ _id: resumeId, userId: user._id });
    if (!resume) throw notFound("Version not found");

    resume.data = version.data;
    resume.markModified("data");
    await resume.save();
    res.json(resume.toApiJSON());
  })
);

export default router;
