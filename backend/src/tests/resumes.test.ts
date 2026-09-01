import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../app";
import { sampleResume, signIn } from "./helpers/fixtures";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/testDb";

let app: Express;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
});

afterAll(stopTestDb);
beforeEach(clearTestDb);

describe("/api/resumes authorization", () => {
  it("rejects unauthenticated access to every route", async () => {
    const anonymous = request(app);
    const responses = await Promise.all([
      anonymous.get("/api/resumes"),
      anonymous.post("/api/resumes").send({ data: sampleResume }),
      anonymous.patch("/api/resumes/6636f0a1c2d3e4f5a6b7c8da").send({ title: "x" }),
      anonymous.delete("/api/resumes/6636f0a1c2d3e4f5a6b7c8da"),
      anonymous.get("/api/resumes/6636f0a1c2d3e4f5a6b7c8da/versions"),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.body.detail).toBe("Authentication required");
    }
  });

  it("does not expose another user's resume", async () => {
    const owner = await signIn(app);
    const created = await owner.agent.post("/api/resumes").send({ data: sampleResume });
    const resumeId = created.body.id;

    const stranger = await signIn(app);
    expect((await stranger.agent.get(`/api/resumes/${resumeId}`)).status).toBe(404);
    expect((await stranger.agent.patch(`/api/resumes/${resumeId}`).send({ title: "Hijacked" })).status).toBe(404);
    expect((await stranger.agent.delete(`/api/resumes/${resumeId}`)).status).toBe(404);
    expect((await stranger.agent.get("/api/resumes")).body).toEqual([]);
  });
});

describe("/api/resumes CRUD", () => {
  it("starts with an empty list", async () => {
    const { agent } = await signIn(app);
    const response = await agent.get("/api/resumes");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("creates a resume with the payload keys the frontend reads", async () => {
    const { agent, userId } = await signIn(app);
    const response = await agent
      .post("/api/resumes")
      .send({ title: "Launch Resume", templateId: "ats", data: sampleResume });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      user_id: userId,
      title: "Launch Resume",
      template_id: "ats",
      templateId: "ats",
    });
    expect(typeof response.body.id).toBe("string");
    expect(response.body.created_at).toBeTruthy();
    expect(response.body.updated_at).toBeTruthy();
    expect(response.body.data.header.fullName).toBe("Asha Rao");
  });

  it("applies defaults for title and templateId", async () => {
    const { agent } = await signIn(app);
    const response = await agent.post("/api/resumes").send({ data: sampleResume });

    expect(response.body.title).toBe("Untitled Resume");
    expect(response.body.template_id).toBe("indexnine");
  });

  it("rejects a create without resume data", async () => {
    const { agent } = await signIn(app);
    const response = await agent.post("/api/resumes").send({ title: "No data" });
    expect(response.status).toBe(400);
    expect(String(response.body.detail)).toContain("data");
  });

  it("patches title, template and nested data independently", async () => {
    const { agent } = await signIn(app);
    const created = await agent.post("/api/resumes").send({ data: sampleResume });
    const resumeId = created.body.id;

    const titleOnly = await agent.patch(`/api/resumes/${resumeId}`).send({ title: "Renamed" });
    expect(titleOnly.status).toBe(200);
    expect(titleOnly.body.title).toBe("Renamed");
    expect(titleOnly.body.data.header.fullName).toBe("Asha Rao");

    const dataUpdate = await agent.patch(`/api/resumes/${resumeId}`).send({
      templateId: "modern",
      data: { ...sampleResume, header: { ...sampleResume.header, fullName: "Asha R." } },
    });
    expect(dataUpdate.body.template_id).toBe("modern");
    expect(dataUpdate.body.data.header.fullName).toBe("Asha R.");
    expect(dataUpdate.body.title).toBe("Renamed");

    const reread = await agent.get(`/api/resumes/${resumeId}`);
    expect(reread.body.data.header.fullName).toBe("Asha R.");
  });

  it("lists newest updates first", async () => {
    const { agent } = await signIn(app);
    const first = await agent.post("/api/resumes").send({ title: "First", data: sampleResume });
    await agent.post("/api/resumes").send({ title: "Second", data: sampleResume });
    await agent.patch(`/api/resumes/${first.body.id}`).send({ title: "First (edited)" });

    const response = await agent.get("/api/resumes");
    expect(response.body.map((resume: { title: string }) => resume.title)).toEqual([
      "First (edited)",
      "Second",
    ]);
  });

  it("deletes a resume and its versions", async () => {
    const { agent } = await signIn(app);
    const created = await agent.post("/api/resumes").send({ data: sampleResume });
    const resumeId = created.body.id;
    await agent.post(`/api/resumes/${resumeId}/versions`).send({});

    const deleted = await agent.delete(`/api/resumes/${resumeId}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body).toEqual({ ok: true });

    expect((await agent.get(`/api/resumes/${resumeId}`)).status).toBe(404);
    expect((await agent.get(`/api/resumes/${resumeId}/versions`)).status).toBe(404);
    expect((await agent.delete(`/api/resumes/${resumeId}`)).status).toBe(404);
  });

  it("treats a malformed id as not found rather than erroring", async () => {
    const { agent } = await signIn(app);
    const response = await agent.get("/api/resumes/not-an-object-id");
    expect(response.status).toBe(404);
    expect(response.body.detail).toBe("Resume not found");
  });
});
