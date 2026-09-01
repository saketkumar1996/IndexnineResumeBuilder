import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ResumeBuilder, normalizeUploadedResumeData } from "../temp-ui/components/resume/ResumeBuilder";
import { defaultResumeData, sampleResumeData } from "../types/resume";

const signedInUser = {
  id: 1,
  provider: "local",
  name: "Asha Rao",
  email: "asha@example.com",
  picture: "https://media.example.com/asha.jpg",
  signedInAt: "2026-05-29T05:00:00+00:00",
};

const cloudResume = {
  id: "6636f0a1c2d3e4f5a6b7c8da",
  title: "Launch Resume",
  template_id: "indexnine",
  data: defaultResumeData,
};

const renderBuilder = () =>
  render(
    <MemoryRouter initialEntries={["/builder"]}>
      <Routes>
        <Route path="/signin" element={<div>Sign in page</div>} />
        <Route path="/builder" element={<ResumeBuilder />} />
      </Routes>
    </MemoryRouter>,
  );

describe("ResumeBuilder", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
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
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/auth/me")) {
        return new Response(JSON.stringify(signedInUser), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/api/resumes")) {
        return new Response(JSON.stringify([cloudResume]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    });
  });

  it("renders the launch workspace controls", async () => {
    renderBuilder();

    expect(await screen.findByLabelText(/account menu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/resume title/i)).toHaveValue("Launch Resume");
    expect(screen.getByRole("button", { name: /save version/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /versions/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /docx/i })).toBeInTheDocument();
  });

  it("renders the completion checklist and AI panel", async () => {
    renderBuilder();

    expect(await screen.findByText("Completion")).toBeInTheDocument();
    expect(screen.getByText("Job Match And AI Tools")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Paste job description")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Paste a bullet to improve")).toBeInTheDocument();
  });

  it("does not carry sample projects or experience into uploaded resume data", () => {
    const uploaded = normalizeUploadedResumeData({
      header: {
        ...defaultResumeData.header,
        fullName: "Uploaded Candidate",
        designation: "Frontend Engineer",
      },
      skills: { skills: "React, TypeScript" },
      experiences: [],
      projects: [],
      education: [],
    });

    expect(uploaded.header.fullName).toBe("Uploaded Candidate");
    expect(uploaded.experiences).toEqual([]);
    expect(uploaded.projects).toEqual([]);
    expect(uploaded.experiences).not.toEqual(sampleResumeData.experiences);
    expect(uploaded.projects).not.toEqual(sampleResumeData.projects);
  });

  it("accepts older upload payloads that use singular section keys", () => {
    const experience = [{
      company: "Uploaded Corp",
      title: "Engineer",
      location: "Pune",
      startDate: "Jan 2024",
      endDate: "Present",
    }];
    const project = [{
      name: "Uploaded Project",
      description: "Resume project from the uploaded file.",
      technologies: "React",
    }];
    const uploaded = normalizeUploadedResumeData({ experience, project });

    expect(uploaded.experiences[0]).toMatchObject(experience[0]);
    expect(uploaded.projects[0]).toMatchObject(project[0]);
  });

  it("normalizes uploaded experience dates into MMM YYYY", () => {
    const uploaded = normalizeUploadedResumeData({
      experiences: [
        { company: "A", title: "Engineer", location: "Pune", startDate: "April 2024", endDate: "current" },
        { company: "B", title: "Intern", location: "Pune", startDate: "04/2023", endDate: "2023-12" },
        { company: "C", title: "Lead", location: "Pune", startDate: "Jan 2021 - Present" },
        { company: "D", title: "Analyst", location: "Pune", startDate: "2022-08" },
      ],
    });

    expect(uploaded.experiences[0]).toMatchObject({ startDate: "Apr 2024", endDate: "Present" });
    expect(uploaded.experiences[1]).toMatchObject({ startDate: "Apr 2023", endDate: "Dec 2023" });
    expect(uploaded.experiences[2]).toMatchObject({ startDate: "Jan 2021", endDate: "Present" });
    expect(uploaded.experiences[3]).toMatchObject({ startDate: "Aug 2022", endDate: "" });
  });

  it("promotes the first project bullet to description when the upload has no description", () => {
    const uploaded = normalizeUploadedResumeData({
      project: {
        projectName: "Workflow Platform",
        techStack: "React, Node.js",
        bullets: [
          "Built a workflow platform for enterprise operations.",
          "Integrated document-aware task routing and comments.",
        ],
      },
    });

    expect(uploaded.projects[0]).toMatchObject({
      name: "Workflow Platform",
      description: "Built a workflow platform for enterprise operations.",
      technologies: "React, Node.js",
      responsibilities: ["Integrated document-aware task routing and comments."],
    });
  });

  it("limits uploaded experience and project bullets without inventing missing bullets", () => {
    const uploaded = normalizeUploadedResumeData({
      experience: {
        company: "Example Co",
        title: "Engineer",
        responsibilities: ["One", "Two", "Three", "Four"],
      },
      project: {
        name: "Selected Project",
        description: "Project description.",
        responsibilities: ["Alpha", "Beta", "Gamma"],
      },
    });

    expect(uploaded.experiences[0].responsibilities).toEqual(["One", "Two", "Three"]);
    expect(uploaded.projects[0].responsibilities).toEqual(["Alpha", "Beta"]);
    expect(normalizeUploadedResumeData({ experience: { company: "No Bullets" } }).experiences[0].responsibilities).toEqual([]);
  });
});
