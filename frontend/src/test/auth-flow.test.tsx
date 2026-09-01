import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SignIn from "../temp-ui/pages/SignIn";
import { ResumeBuilder } from "../temp-ui/components/resume/ResumeBuilder";
import { defaultResumeData } from "../types/resume";
import {
  AUTH_USER_STORAGE_KEY,
  RESUME_DRAFT_STORAGE_KEY,
  type AuthUser,
} from "../utils/auth";

const signedInUser: AuthUser = {
  id: 1,
  provider: "local",
  name: "Asha Rao",
  email: "asha@example.com",
  picture: "",
  signedInAt: "2026-05-29T05:00:00+00:00",
};

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

const renderAppAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/builder" element={<ResumeBuilder />} />
      </Routes>
    </MemoryRouter>,
  );

describe("Custom auth flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.pushState({}, "", "/builder");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders email and password sign-in instead of LinkedIn", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));

    renderSignInAt("/signin");

    expect(screen.getByRole("tab", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in with linkedin/i })).not.toBeInTheDocument();
  });

  it("signs in with email and password and redirects to the builder", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/auth/login") && init?.method === "POST") {
        return new Response(JSON.stringify(signedInUser), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 401 });
    });

    renderSignInAt("/signin");
    await user.type(screen.getByLabelText(/^email$/i), "asha@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secretpass");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await screen.findByText("Builder Route");
    expect(JSON.parse(window.localStorage.getItem(AUTH_USER_STORAGE_KEY) || "{}")).toMatchObject({
      provider: "local",
      email: "asha@example.com",
      name: "Asha Rao",
    });
  });

  it("shows account controls when signed in", () => {
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(signedInUser));
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/auth/me")) {
        return new Response(JSON.stringify(signedInUser), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/api/resumes")) {
        return new Response(JSON.stringify([
          { id: 10, title: "Launch Resume", template_id: "indexnine", data: defaultResumeData },
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    });

    renderAppAt("/builder");

    expect(screen.getByLabelText(/account menu/i)).toBeInTheDocument();
    expect(screen.getByText("Asha Rao")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^sign in$/i })).not.toBeInTheDocument();
  });

  it("logs out without clearing the session resume draft", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(signedInUser));
    window.sessionStorage.setItem(RESUME_DRAFT_STORAGE_KEY, JSON.stringify(defaultResumeData));
    let sessionActive = true;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/auth/logout") && init?.method === "POST") {
        sessionActive = false;
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/api/auth/me")) {
        if (!sessionActive) return new Response("{}", { status: 401 });
        return new Response(JSON.stringify(signedInUser), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/api/resumes")) {
        return new Response(JSON.stringify([
          { id: 10, title: "Launch Resume", template_id: "indexnine", data: defaultResumeData },
        ]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    });

    renderAppAt("/builder");
    await user.click(screen.getByLabelText(/account menu/i));
    await user.click(await screen.findByText("Logout"));

    await waitFor(() => {
      expect(window.localStorage.getItem(AUTH_USER_STORAGE_KEY)).toBeNull();
    });
    expect(await screen.findByLabelText(/^email$/i)).toBeInTheDocument();
    expect(window.sessionStorage.getItem(RESUME_DRAFT_STORAGE_KEY)).not.toBeNull();
  });

  it("redirects guests to sign in for the SaaS workspace", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));
    renderAppAt("/builder");

    expect(await screen.findByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/resume title/i)).not.toBeInTheDocument();
  });

  it("opens the sign-in page from the builder without bouncing back", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).includes("/api/auth/me")) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return new Response("{}", { status: 401 });
    });

    renderAppAt("/builder");
    await user.click(screen.getByRole("link", { name: /^sign in$/i }));

    expect(await screen.findByLabelText(/^email$/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/resume title/i)).not.toBeInTheDocument();
    });
  });
});
