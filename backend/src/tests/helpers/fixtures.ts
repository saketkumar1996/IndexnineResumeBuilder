import request from "supertest";
import type { Express } from "express";
import type { ResumeData } from "../../types/resume";

export const sampleResume: ResumeData = {
  header: {
    fullName: "Asha Rao",
    designation: "Sr. Consultant - Software Engineer",
    email: "asha.rao@example.com",
    phone: "+1 (555) 123-4567",
    location: "Pune, Maharashtra",
    linkedin: "https://linkedin.com/in/asha-rao",
    github: "",
    portfolio: "",
  },
  expertise: {
    summary: "Frontend engineer focused on Angular and React delivery across fintech and security domains.",
    bulletPoints: ["Led migration of a legacy dashboard to Angular 17."],
  },
  skills: { skills: "Angular, TypeScript, React, Node.js, Jest" },
  experiences: [
    {
      company: "Indexnine Technologies Pvt. Ltd.",
      title: "Sr. Consultant - Senior Software Engineer",
      location: "Pune",
      startDate: "APR 2024",
      endDate: "Present",
      responsibilities: ["Built the compliance reporting module.", "Mentored two junior engineers."],
    },
  ],
  projects: [
    {
      name: "Cyber Compliance",
      description: "Risk management platform for monitoring and remediating cyber risk in real time.",
      technologies: "Angular 17, TypeScript, Postgres",
      client: "Smarsh",
      developmentTools: "VS Code, Git, Jira",
      teamSize: "40",
      responsibilities: ["Integrated AG-Grid for sortable data tables."],
      link: "",
    },
  ],
  education: [
    {
      institution: "Amravati University",
      degree: "B.E. (Information Technology)",
      location: "Amravati, Maharashtra",
      startYear: "2011",
      endYear: "2016",
      gpa: "",
      honors: "",
    },
  ],
  awards: [{ title: "Hackathon runner up", year: "2015", organization: "College" }],
};

export interface SignedInAgent {
  agent: request.Agent;
  userId: string;
  email: string;
}

let emailCounter = 0;

/** Registers a fresh user and returns an agent that carries their session cookie. */
export const signIn = async (app: Express, password = "password123"): Promise<SignedInAgent> => {
  emailCounter += 1;
  const email = `user${emailCounter}.${Date.now()}@example.com`;
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/register").send({ name: "Test User", email, password });
  if (response.status !== 200) {
    throw new Error(`register failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return { agent, userId: response.body.id, email };
};
