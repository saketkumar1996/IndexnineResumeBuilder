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

const createResume = async (agent: request.Agent) => {
  const response = await agent.post("/api/resumes").send({ title: "Launch Resume", data: sampleResume });
  return response.body.id as string;
};

describe("resume versions", () => {
  it("numbers snapshots sequentially and labels them by default", async () => {
    const { agent, userId } = await signIn(app);
    const resumeId = await createResume(agent);

    const first = await agent.post(`/api/resumes/${resumeId}/versions`).send({});
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({
      resume_id: resumeId,
      user_id: userId,
      version_number: 1,
      label: "Version 1",
    });
    expect(first.body.data.header.fullName).toBe("Asha Rao");

    const second = await agent.post(`/api/resumes/${resumeId}/versions`).send({ label: "Launch snapshot" });
    expect(second.body.version_number).toBe(2);
    expect(second.body.label).toBe("Launch snapshot");
  });

  it("lists versions newest first", async () => {
    const { agent } = await signIn(app);
    const resumeId = await createResume(agent);
    await agent.post(`/api/resumes/${resumeId}/versions`).send({});
    await agent.post(`/api/resumes/${resumeId}/versions`).send({});

    const response = await agent.get(`/api/resumes/${resumeId}/versions`);
    expect(response.status).toBe(200);
    expect(response.body.map((version: { version_number: number }) => version.version_number)).toEqual([2, 1]);
  });

  it("snapshots the data at save time and restores it afterwards", async () => {
    const { agent } = await signIn(app);
    const resumeId = await createResume(agent);

    const snapshot = await agent.post(`/api/resumes/${resumeId}/versions`).send({ label: "Before edits" });

    await agent.patch(`/api/resumes/${resumeId}`).send({
      data: { ...sampleResume, header: { ...sampleResume.header, fullName: "Someone Else" } },
    });
    expect((await agent.get(`/api/resumes/${resumeId}`)).body.data.header.fullName).toBe("Someone Else");

    const restored = await agent.post(
      `/api/resumes/${resumeId}/versions/${snapshot.body.id}/restore`
    );
    expect(restored.status).toBe(200);
    expect(restored.body.id).toBe(resumeId);
    expect(restored.body.data.header.fullName).toBe("Asha Rao");

    const reread = await agent.get(`/api/resumes/${resumeId}`);
    expect(reread.body.data.header.fullName).toBe("Asha Rao");
  });

  it("returns 404 for versions of a resume the caller does not own", async () => {
    const owner = await signIn(app);
    const resumeId = await createResume(owner.agent);
    const snapshot = await owner.agent.post(`/api/resumes/${resumeId}/versions`).send({});

    const stranger = await signIn(app);
    expect((await stranger.agent.get(`/api/resumes/${resumeId}/versions`)).status).toBe(404);
    expect((await stranger.agent.post(`/api/resumes/${resumeId}/versions`).send({})).status).toBe(404);

    const restore = await stranger.agent.post(
      `/api/resumes/${resumeId}/versions/${snapshot.body.id}/restore`
    );
    expect(restore.status).toBe(404);
    expect(restore.body.detail).toBe("Version not found");
  });

  it("returns 404 restoring an unknown version id", async () => {
    const { agent } = await signIn(app);
    const resumeId = await createResume(agent);

    const response = await agent.post(
      `/api/resumes/${resumeId}/versions/6636f0a1c2d3e4f5a6b7c8da/restore`
    );
    expect(response.status).toBe(404);
    expect(response.body.detail).toBe("Version not found");
  });
});
