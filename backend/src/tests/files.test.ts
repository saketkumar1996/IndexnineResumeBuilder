import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../app";
import { sampleResume } from "./helpers/fixtures";

let app: Express;

// These routes are unauthenticated and never touch MongoDB, so no test database.
beforeAll(() => {
  app = createApp();
});

describe("POST /api/export/docx", () => {
  it("returns a Word document named after the candidate", async () => {
    // responseType("blob") makes superagent buffer the binary body instead of
    // trying to parse it as text.
    const response = await request(app).post("/api/export/docx").send(sampleResume).responseType("blob");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(response.headers["content-disposition"]).toBe("attachment; filename=Asha_Rao.docx");

    const body = response.body as Buffer;
    expect(Buffer.isBuffer(body)).toBe(true);
    // DOCX files are zip archives.
    expect(body.subarray(0, 2).toString("latin1")).toBe("PK");
    expect(body.length).toBeGreaterThan(1000);
  });

  it("falls back to resume.docx when there is no name", async () => {
    const response = await request(app)
      .post("/api/export/docx")
      .send({ ...sampleResume, header: { ...sampleResume.header, fullName: "" } });

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toBe("attachment; filename=resume.docx");
  });

  it("exports an empty resume without failing", async () => {
    const response = await request(app).post("/api/export/docx").send({}).responseType("blob");
    expect(response.status).toBe(200);
    expect((response.body as Buffer).subarray(0, 2).toString("latin1")).toBe("PK");
  });
});

describe("POST /api/upload-resume", () => {
  it("rejects a request with no file", async () => {
    const response = await request(app).post("/api/upload-resume");
    expect(response.status).toBe(400);
    expect(response.body.detail).toBe("No file provided");
  });

  it("rejects an unsupported file type before doing any work", async () => {
    const response = await request(app)
      .post("/api/upload-resume")
      .attach("file", Buffer.from("plain text resume"), "resume.txt");

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe("Invalid file type. Please upload a PDF or DOCX file.");
  });
});

describe("unknown routes", () => {
  it("returns a detail envelope the frontend can read", async () => {
    const response = await request(app).get("/api/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ detail: "Not Found" });
  });

  it("no longer serves the retired validate, preview and export endpoints", async () => {
    for (const path of ["/api/validate", "/api/preview", "/api/export"]) {
      const response = await request(app).post(path).send(sampleResume);
      expect(response.status).toBe(404);
    }
  });
});
