import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../app";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/testDb";

let app: Express;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
});

afterAll(stopTestDb);
beforeEach(clearTestDb);

describe("GET /health", () => {
  it("reports the service as healthy", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "healthy", service: "Indexnine-resume-builder" });
  });
});

describe("POST /api/auth/register", () => {
  it("creates an account, sets a session cookie and returns the user", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "Asha Rao", email: "Asha@Example.com", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      provider: "local",
      name: "Asha Rao",
      email: "asha@example.com",
      picture: "",
    });
    expect(typeof response.body.id).toBe("string");
    expect(response.body.id).toHaveLength(24);
    expect(response.body).not.toHaveProperty("passwordHash");

    const cookies = response.headers["set-cookie"] as unknown as string[];
    expect(cookies.join(";")).toContain("indexnine_session=");
    expect(cookies.join(";")).toContain("HttpOnly");
  });

  it("defaults the name to the email local part", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "no.name@example.com", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("no.name");
  });

  it("rejects an invalid email with 400", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "password123" });

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe("Enter a valid email address.");
  });

  it("rejects a password shorter than 8 characters with 400", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "short@example.com", password: "1234567" });

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe("Password must be at least 8 characters.");
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send({ email: "dup@example.com", password: "password123" });
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "DUP@example.com", password: "password123" });

    expect(response.status).toBe(409);
    expect(response.body.detail).toBe("An account with this email already exists.");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({ email: "asha@example.com", password: "password123" });
  });

  it("signs in with the correct password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "asha@example.com", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe("asha@example.com");
  });

  it("rejects a wrong password with 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "asha@example.com", password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe("Invalid email or password.");
  });

  it("rejects an unknown email with 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe("Invalid email or password.");
  });
});

describe("session lifecycle", () => {
  it("requires a session for /api/auth/me", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
    expect(response.body.detail).toBe("Authentication required");
  });

  it("returns the signed-in user and clears the session on logout", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ email: "asha@example.com", password: "password123" });

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.email).toBe("asha@example.com");

    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(200);
    expect(logout.body).toEqual({ ok: true });

    const afterLogout = await agent.get("/api/auth/me");
    expect(afterLogout.status).toBe(401);
  });

  it("rejects a tampered session cookie", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "indexnine_session=not.a.valid.token");

    expect(response.status).toBe(401);
  });
});
