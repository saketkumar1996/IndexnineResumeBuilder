import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../app";
import { isAiConfigured } from "../services/openai";
import { sampleResume, signIn } from "./helpers/fixtures";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/testDb";

let app: Express;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
});

afterAll(stopTestDb);
beforeEach(clearTestDb);

describe("/api/ai authorization", () => {
  it("requires a session on every AI route", async () => {
    const anonymous = request(app);
    const responses = await Promise.all([
      anonymous.post("/api/ai/job-match").send({ resumeData: sampleResume, jobDescription: "Angular" }),
      anonymous.post("/api/ai/improve-bullet").send({ bullet: "Built things" }),
      anonymous.post("/api/ai/cover-letter").send({ resumeData: sampleResume, jobDescription: "Angular" }),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.body.detail).toBe("Authentication required");
    }
  });
});

describe("/api/ai request validation", () => {
  it("requires a job description for job-match", async () => {
    const { agent } = await signIn(app);
    const response = await agent
      .post("/api/ai/job-match")
      .send({ resumeData: sampleResume, jobDescription: "   " });

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe("Job description is required");
  });

  it("requires a bullet for improve-bullet", async () => {
    const { agent } = await signIn(app);
    const response = await agent.post("/api/ai/improve-bullet").send({ bullet: "" });

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe("Bullet is required");
  });

  it("requires a job description for cover-letter", async () => {
    const { agent } = await signIn(app);
    const response = await agent
      .post("/api/ai/cover-letter")
      .send({ resumeData: sampleResume, jobDescription: "" });

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe("Job description is required");
  });
});

// Skipped when a real key is present, so the suite never bills a live AI call.
describe.skipIf(isAiConfigured())("/api/ai without OPENAI_API_KEY", () => {
  it("returns 503 for job-match", async () => {
    const { agent } = await signIn(app);
    const response = await agent
      .post("/api/ai/job-match")
      .send({ resumeData: sampleResume, jobDescription: "Senior Angular engineer" });

    expect(response.status).toBe(503);
    expect(response.body.detail).toBe("AI is not configured. Set OPENAI_API_KEY.");
  });

  it("returns 503 for upload-resume", async () => {
    const response = await request(app)
      .post("/api/upload-resume")
      .attach("file", Buffer.from("%PDF-1.4 fake"), "resume.pdf");

    expect(response.status).toBe(503);
    expect(response.body.detail).toBe("AI parse is not configured. Set OPENAI_API_KEY in backend/.env");
  });
});
