import type { ResumeData } from "@/types/resume";
import type { AuthUser } from "@/utils/auth";

export interface CloudResume {
  id: string;
  title: string;
  template_id?: string;
  templateId?: string;
  data: ResumeData;
  created_at?: string;
  updated_at?: string;
}

export interface ResumeVersion {
  id: string;
  resume_id: string;
  version_number: number;
  label: string;
  data: ResumeData;
  created_at?: string;
}

export interface MatchResult {
  matchScore: number;
  missingKeywords: string[];
  strengths: string[];
  risks: string[];
  sectionSuggestions: Record<string, string[]>;
}

export interface ImproveBulletResult {
  options: {
    style: "concise" | "impact" | "metrics";
    text: string;
  }[];
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const readErrorMessage = async (response: Response) => {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
    if (body?.detail?.message) return body.detail.message;
    if (body?.message) return body.message;
  } catch {
    // Fall through to status text.
  }
  return response.statusText || "Request failed";
};

export const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const authApi = {
  me: () => apiFetch<AuthUser>("/api/auth/me"),
  login: (payload: { email: string; password: string }) =>
    apiFetch<AuthUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload: { name?: string; email: string; password: string }) =>
    apiFetch<AuthUser>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
};

export const resumesApi = {
  list: () => apiFetch<CloudResume[]>("/api/resumes"),
  create: (payload: { title: string; templateId: string; data: ResumeData }) =>
    apiFetch<CloudResume>("/api/resumes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Partial<{ title: string; templateId: string; data: ResumeData }>) =>
    apiFetch<CloudResume>(`/api/resumes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/resumes/${id}`, {
      method: "DELETE",
    }),
  saveVersion: (id: string, label?: string) =>
    apiFetch<ResumeVersion>(`/api/resumes/${id}/versions`, {
      method: "POST",
      body: JSON.stringify({ label }),
    }),
  versions: (id: string) => apiFetch<ResumeVersion[]>(`/api/resumes/${id}/versions`),
  restoreVersion: (id: string, versionId: string) =>
    apiFetch<CloudResume>(`/api/resumes/${id}/versions/${versionId}/restore`, {
      method: "POST",
    }),
};

export const aiApi = {
  jobMatch: (payload: { resumeData: ResumeData; jobDescription: string }) =>
    apiFetch<MatchResult>("/api/ai/job-match", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  improveBullet: (payload: { bullet: string; jobDescription?: string; resumeData?: ResumeData }) =>
    apiFetch<ImproveBulletResult>("/api/ai/improve-bullet", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  coverLetter: (payload: { resumeId?: string; resumeData: ResumeData; jobDescription: string }) =>
    apiFetch<{ content: string; saved: boolean }>("/api/ai/cover-letter", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const uploadResume = async (formData: FormData) =>
  apiFetch<Partial<ResumeData>>("/api/upload-resume", {
    method: "POST",
    body: formData,
  });

export const exportDocx = async (resumeData: ResumeData) => {
  const response = await fetch(apiUrl("/api/export/docx"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resumeData),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  return response.blob();
};
