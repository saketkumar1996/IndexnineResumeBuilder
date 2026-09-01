import { describe, expect, it } from "vitest";
import {
  normalizeDate,
  normalizeUploadedResumeData,
  parseExperienceDates,
  resumeText,
} from "../services/normalize";
import { sampleResume } from "./helpers/fixtures";

type UploadedResume = {
  header: Record<string, string>;
  expertise: { summary: string; bulletPoints: string[] };
  skills: { skills: string };
  experiences: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  education: unknown[];
  awards: unknown[];
};

const normalize = (input: unknown) => normalizeUploadedResumeData(input) as unknown as UploadedResume;

describe("normalizeDate", () => {
  it("normalizes named, numeric and ISO-ish months to MMM YYYY", () => {
    expect(normalizeDate("April 2024")).toBe("APR 2024");
    expect(normalizeDate("Apr 2024")).toBe("APR 2024");
    expect(normalizeDate("Sept 2019")).toBe("SEP 2019");
    expect(normalizeDate("04/2023")).toBe("APR 2023");
    expect(normalizeDate("2023-12")).toBe("DEC 2023");
    expect(normalizeDate("2022-08")).toBe("AUG 2022");
  });

  it("maps every spelling of an open-ended date to Present", () => {
    for (const value of ["Present", "present", "current", "now", "ongoing"]) {
      expect(normalizeDate(value)).toBe("Present");
    }
  });

  it("uses the fallback month for a bare year", () => {
    expect(normalizeDate("2016")).toBe("JAN 2016");
    expect(normalizeDate("2020", "MAY")).toBe("MAY 2020");
  });

  it("expands two-digit years around the 50 pivot", () => {
    expect(normalizeDate("Jan '99")).toBe("JAN 1999");
    expect(normalizeDate("Jan '05")).toBe("JAN 2005");
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeDate("")).toBe("");
    expect(normalizeDate(null)).toBe("");
    expect(normalizeDate(undefined)).toBe("");
  });
});

describe("parseExperienceDates", () => {
  it("splits a combined range when only the start field is filled", () => {
    expect(parseExperienceDates("Jan 2021 - Present", "")).toEqual(["JAN 2021", "Present"]);
    expect(parseExperienceDates("Apr 2023 – Mar 2024", "")).toEqual(["APR 2023", "MAR 2024"]);
    expect(parseExperienceDates("Jan 2021 to Dec 2022", "")).toEqual(["JAN 2021", "DEC 2022"]);
  });

  it("keeps explicit start and end fields", () => {
    expect(parseExperienceDates("April 2024", "current")).toEqual(["APR 2024", "Present"]);
    expect(parseExperienceDates("2022-08", "")).toEqual(["AUG 2022", ""]);
  });

  it("never reports Present as a start date", () => {
    expect(parseExperienceDates("Present", "")).toEqual(["", ""]);
  });
});

describe("normalizeUploadedResumeData", () => {
  it("falls back to the first project bullet for a missing description", () => {
    const normalized = normalize({
      project: {
        projectName: "Workflow Platform",
        techStack: "React, Node.js",
        bullets: [
          "Built a workflow platform for enterprise operations.",
          "Integrated document-aware task routing and comments.",
        ],
      },
    });

    expect(normalized.projects[0].name).toBe("Workflow Platform");
    expect(normalized.projects[0].description).toBe("Built a workflow platform for enterprise operations.");
    expect(normalized.projects[0].technologies).toBe("React, Node.js");
    expect(normalized.projects[0].responsibilities).toEqual([
      "Integrated document-aware task routing and comments.",
    ]);
  });

  it("keeps an explicit description and clamps project bullets to two", () => {
    const normalized = normalize({
      projects: [
        {
          name: "Rights Management",
          description: "Secure document workflow platform.",
          responsibilities: ["Implemented watermarking.", "Added audit tracking.", "Built export controls."],
        },
      ],
    });

    expect(normalized.projects[0].description).toBe("Secure document workflow platform.");
    expect(normalized.projects[0].responsibilities).toEqual([
      "Implemented watermarking.",
      "Added audit tracking.",
    ]);
  });

  it("clamps experience bullets to three", () => {
    const normalized = normalize({
      experiences: [{ company: "Example Co", title: "Engineer", responsibilities: ["One", "Two", "Three", "Four"] }],
    });

    expect(normalized.experiences[0].responsibilities).toEqual(["One", "Two", "Three"]);
  });

  it("normalizes every experience date format the AI returns", () => {
    const normalized = normalize({
      experiences: [
        { company: "A", startDate: "April 2024", endDate: "current" },
        { company: "B", startDate: "04/2023", endDate: "2023-12" },
        { company: "C", startDate: "Jan 2021 - Present" },
        { company: "D", startDate: "2022-08", endDate: "" },
      ],
    });

    expect(normalized.experiences.map((exp) => [exp.startDate, exp.endDate])).toEqual([
      ["APR 2024", "Present"],
      ["APR 2023", "DEC 2023"],
      ["JAN 2021", "Present"],
      ["AUG 2022", ""],
    ]);
  });

  it("resolves header, expertise and skills aliases", () => {
    const normalized = normalize({
      header: { name: "Asha Rao", title: "Senior Engineer", linkedIn: "https://in.example", website: "https://folio" },
      expertise: { profile: "Frontend engineer.", highlights: ["Shipped a design system."] },
      skills: "React, Node.js",
    });

    expect(normalized.header.fullName).toBe("Asha Rao");
    expect(normalized.header.designation).toBe("Senior Engineer");
    expect(normalized.header.linkedin).toBe("https://in.example");
    expect(normalized.header.portfolio).toBe("https://folio");
    expect(normalized.expertise.summary).toBe("Frontend engineer.");
    expect(normalized.expertise.bulletPoints).toEqual(["Shipped a design system."]);
    expect(normalized.skills.skills).toBe("React, Node.js");
  });

  it("splits bullet strings and strips list markers", () => {
    const normalized = normalize({
      experiences: [{ company: "A", bullets: "- Shipped the API\n\u2022 Cut latency in half" }],
    });

    expect(normalized.experiences[0].responsibilities).toEqual(["Shipped the API", "Cut latency in half"]);
  });

  it("returns empty sections for junk input instead of throwing", () => {
    const normalized = normalize(null);
    expect(normalized.header.fullName).toBe("");
    expect(normalized.experiences).toEqual([]);
    expect(normalized.projects).toEqual([]);
    expect(normalized.education).toEqual([]);
    expect(normalized.awards).toEqual([]);
  });
});

describe("resumeText", () => {
  it("flattens the fields an AI prompt needs", () => {
    const text = resumeText(sampleResume);

    expect(text).toContain("Asha Rao");
    expect(text).toContain("Sr. Consultant - Software Engineer");
    expect(text).toContain("Angular, TypeScript, React, Node.js, Jest");
    expect(text).toContain("Built the compliance reporting module.");
    expect(text).toContain("Cyber Compliance");
    expect(text).not.toContain("asha.rao@example.com");
  });

  it("tolerates missing sections", () => {
    expect(resumeText({})).toBe("");
    expect(resumeText(null)).toBe("");
  });
});
