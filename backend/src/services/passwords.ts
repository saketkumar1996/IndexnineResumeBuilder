import bcrypt from "bcryptjs";

export const PASSWORD_MIN_LENGTH = 8;

const BCRYPT_COST = 12;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const normalizeEmail = (email: string): string => (email || "").trim().toLowerCase();

export const isValidEmail = (email: string): boolean => EMAIL_RE.test(normalizeEmail(email));

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, BCRYPT_COST);

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  if (!password || !stored) return false;
  try {
    return await bcrypt.compare(password, stored);
  } catch {
    return false;
  }
};
