import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SignIn from "../temp-ui/pages/SignIn";
import { ResumeBuilder } from "../temp-ui/components/resume/ResumeBuilder";
import { defaultResumeData } from "../types/resume";
import {
  AUTH_USER_STORAGE_KEY,
  LINKEDIN_RESUME_DATA_STORAGE_KEY,
  RESUME_DRAFT_STORAGE_KEY,
  type AuthUser,
  type LinkedInAuthPayload,
} from "../utils/auth";

const encodeBase64Url = (value: unknown) =>
  btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const renderSignInAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/builder" element={<div>Builder Route</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("LinkedIn auth flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.pushState({}, "", "/builder");
  });

  it("renders only LinkedIn login on the sign-in screen", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));

    renderSignInAt("/signin");

    expect(screen.getByRole("link", { name: /sign in with linkedin/i })).toHaveAttribute(
      "href",
      "/api/linkedin/auth",
    );
    expect(screen.queryByRole("button", { name: /continue without signing in/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/upload resume/i)).not.toBeInTheDocument();
  });

  it("stores LinkedIn auth payload and redirects to the builder", async () => {
    const payload: LinkedInAuthPayload = {
      profile: {
        provider: "linkedin",
        name: "Asha Rao",
        email: "asha@example.com",
        picture: "https://media.example.com/asha.jpg",
        signedInAt: "2026-05-29T05:00:00+00:00",
      },
      resumeData: {
        ...defaultResumeData,
        header: {
          ...defaultResumeData.header,
          fullName: "Asha Rao",
          email: "asha@example.com",
        },
      },
    };

    renderSignInAt(`/signin?linkedin_auth=${encodeBase64Url(payload)}`);

    await screen.findByText("Builder Route");
    expect(JSON.parse(window.localStorage.getItem(AUTH_USER_STORAGE_KEY) || "{}")).toMatchObject(payload.profile);
    expect(JSON.parse(window.sessionStorage.getItem(LINKEDIN_RESUME_DATA_STORAGE_KEY) || "{}")).toMatchObject({
      header: { fullName: "Asha Rao", email: "asha@example.com" },
    });
  });

  it("stores a LinkedIn app session for legacy linkedin_data redirects", async () => {
    const resumeData = {
      ...defaultResumeData,
      header: {
        ...defaultResumeData.header,
        fullName: "Saket Kumar Jha",
        email: "saket@example.com",
      },
    };

    renderSignInAt(`/signin?linkedin_data=${encodeBase64Url(resumeData)}`);

    await screen.findByText("Builder Route");
    expect(JSON.parse(window.localStorage.getItem(AUTH_USER_STORAGE_KEY) || "{}")).toMatchObject({
      provider: "linkedin",
      name: "Saket Kumar Jha",
      email: "saket@example.com",
      picture: "",
    });
    expect(JSON.parse(window.sessionStorage.getItem(LINKEDIN_RESUME_DATA_STORAGE_KEY) || "{}")).toMatchObject({
      header: { fullName: "Saket Kumar Jha", email: "saket@example.com" },
    });
  });

  it("shows LinkedIn profile controls when signed in", () => {
    const user: AuthUser = {
      id: 1,
      provider: "linkedin",
      name: "Asha Rao",
      email: "asha@example.com",
      picture: "https://media.example.com/asha.jpg",
      signedInAt: "2026-05-29T05:00:00+00:00",
    };
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/auth/me")) {
        return new Response(JSON.stringify(user), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/api/resumes")) {
        return new Response(JSON.stringify([
          { id: 10, title: "Launch Resume", template_id: "indexnine", data: defaultResumeData },
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    });

    render(<ResumeBuilder />);

    expect(screen.getByLabelText(/linkedin profile menu/i)).toBeInTheDocument();
    expect(screen.getByText("Asha Rao")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^sign in$/i })).not.toBeInTheDocument();
  });

  it("logs out without clearing the session resume draft", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      AUTH_USER_STORAGE_KEY,
      JSON.stringify({
        id: 1,
        provider: "linkedin",
        name: "Asha Rao",
        email: "asha@example.com",
        picture: "",
        signedInAt: "2026-05-29T05:00:00+00:00",
      }),
    );
    window.sessionStorage.setItem(RESUME_DRAFT_STORAGE_KEY, JSON.stringify(defaultResumeData));
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/auth/logout") && init?.method === "POST") {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({
          id: 1,
          provider: "linkedin",
          name: "Asha Rao",
          email: "asha@example.com",
          picture: "",
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/api/resumes")) {
        return new Response(JSON.stringify([
          { id: 10, title: "Launch Resume", template_id: "indexnine", data: defaultResumeData },
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    });

    render(<ResumeBuilder />);
    await user.click(screen.getByLabelText(/linkedin profile menu/i));
    await user.click(await screen.findByText("Logout"));

    await waitFor(() => {
      expect(window.localStorage.getItem(AUTH_USER_STORAGE_KEY)).toBeNull();
      expect(window.location.pathname).toBe("/signin");
    });
    expect(window.sessionStorage.getItem(RESUME_DRAFT_STORAGE_KEY)).not.toBeNull();
  });

  it("redirects guests to sign in for the SaaS workspace", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));
    render(<ResumeBuilder />);

    await waitFor(() => expect(window.location.pathname).toBe("/signin"));
  });
});
