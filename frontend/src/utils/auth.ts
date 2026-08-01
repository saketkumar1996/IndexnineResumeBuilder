import type { ResumeData } from "@/types/resume";

export const AUTH_USER_STORAGE_KEY = "indexnine_auth_user";
export const RESUME_DRAFT_STORAGE_KEY = "indexnine_resume_draft";
export const LINKEDIN_RESUME_DATA_STORAGE_KEY = "linkedin_resume_data";
export const LEGACY_LINKEDIN_DATA_STORAGE_KEY = "linkedin_data";
export const UPLOADED_RESUME_DATA_STORAGE_KEY = "uploaded_resume_data";

export interface AuthUser {
  id?: number;
  provider: "linkedin";
  name: string;
  email: string;
  picture: string;
  signedInAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LinkedInAuthPayload {
  profile: AuthUser;
  resumeData: ResumeData;
  resumeId?: number;
}

const isBrowser = () => typeof window !== "undefined";

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const decodeBase64UrlJson = <T>(encoded: string): T | null => {
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded)) as T;
  } catch {
    return null;
  }
};

export const decodeLinkedInAuthPayload = (encoded: string): LinkedInAuthPayload | null => {
  const payload = decodeBase64UrlJson<LinkedInAuthPayload>(encoded);
  if (!payload?.profile || !payload.resumeData) return null;

  return {
    profile: {
      provider: "linkedin",
      id: payload.profile.id,
      name: payload.profile.name || "",
      email: payload.profile.email || "",
      picture: payload.profile.picture || "",
      signedInAt: payload.profile.signedInAt || new Date().toISOString(),
      createdAt: payload.profile.createdAt,
      updatedAt: payload.profile.updatedAt,
    },
    resumeData: payload.resumeData,
    resumeId: payload.resumeId,
  };
};

export const decodeLegacyLinkedInResumeData = (encoded: string): ResumeData | null => {
  return decodeBase64UrlJson<ResumeData>(encoded);
};

export const getStoredAuthUser = (): AuthUser | null => {
  if (!isBrowser()) return null;
  const user = safeParse<AuthUser>(window.localStorage.getItem(AUTH_USER_STORAGE_KEY));
  return user?.provider === "linkedin" ? user : null;
};

export const setStoredAuthUser = (user: AuthUser) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredAuthUser = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};

export const getStoredResumeDraft = (): ResumeData | null => {
  if (!isBrowser()) return null;
  return safeParse<ResumeData>(window.sessionStorage.getItem(RESUME_DRAFT_STORAGE_KEY));
};

export const setStoredResumeDraft = (data: ResumeData) => {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(RESUME_DRAFT_STORAGE_KEY, JSON.stringify(data));
};

export const setLinkedInResumeData = (data: ResumeData) => {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(LINKEDIN_RESUME_DATA_STORAGE_KEY, JSON.stringify(data));
};

export const consumeLinkedInResumeData = (): ResumeData | null => {
  if (!isBrowser()) return null;

  const data =
    safeParse<ResumeData>(window.sessionStorage.getItem(LINKEDIN_RESUME_DATA_STORAGE_KEY)) ||
    safeParse<ResumeData>(window.sessionStorage.getItem(LEGACY_LINKEDIN_DATA_STORAGE_KEY));

  window.sessionStorage.removeItem(LINKEDIN_RESUME_DATA_STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_LINKEDIN_DATA_STORAGE_KEY);
  return data;
};

export const consumeUploadedResumeData = (): Partial<ResumeData> | null => {
  if (!isBrowser()) return null;
  const data = safeParse<Partial<ResumeData>>(window.sessionStorage.getItem(UPLOADED_RESUME_DATA_STORAGE_KEY));
  window.sessionStorage.removeItem(UPLOADED_RESUME_DATA_STORAGE_KEY);
  return data;
};

export const getInitials = (name: string, email: string) => {
  const source = name.trim() || email.trim();
  if (!source) return "LI";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};
