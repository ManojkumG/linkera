/**
 * Shared domain types used across the DB schema, AI services, and UI.
 * Keep these framework-agnostic (no imports) so both client and server can use them.
 */

export const USER_ROLES = ["seeker", "employee", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const EXPERIENCE_LEVELS = [
  "internship",
  "entry",
  "mid",
  "senior",
  "lead",
  "principal",
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const VERIFICATION_METHODS = [
  "company_email",
  "work_email_otp",
  "linkedin",
  "manual",
] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const VERIFICATION_STATUSES = [
  "unverified",
  "pending",
  "verified",
  "rejected",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/**
 * The referral request lifecycle. Order matters — it's used to render the
 * status timeline and to validate allowed transitions.
 */
export const REQUEST_STATUSES = [
  "requested",
  "viewed",
  "under_review",
  "referred",
  "accepted",
  "rejected",
  "hired",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  requested: "Requested",
  viewed: "Viewed",
  under_review: "Under Review",
  referred: "Referred",
  accepted: "Accepted",
  rejected: "Rejected",
  hired: "Hired",
};

/** Terminal statuses — no further transitions allowed. */
export const TERMINAL_STATUSES: RequestStatus[] = ["rejected", "hired"];

/** Forward transitions the employee may drive a request through. */
export const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  requested: ["viewed", "under_review", "referred", "rejected"],
  viewed: ["under_review", "referred", "rejected"],
  under_review: ["referred", "rejected"],
  referred: ["accepted", "hired", "rejected"],
  accepted: ["hired", "rejected"],
  rejected: [],
  hired: [],
};

// ---- Resume parsing shapes (produced by the AI service layer) ----

export interface EducationEntry {
  institution: string;
  degree: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

export interface ProjectEntry {
  name: string;
  description?: string;
  technologies?: string[];
}

export interface WorkEntry {
  company: string;
  title: string;
  startYear?: number;
  endYear?: number;
  summary?: string;
}

export interface ParsedResume {
  fullName?: string;
  email?: string;
  phone?: string;
  headline?: string;
  location?: string;
  yearsExperience?: number;
  skills: string[];
  education: EducationEntry[];
  certifications: string[];
  projects: ProjectEntry[];
  workHistory: WorkEntry[];
}

export interface StatusHistoryEntry {
  status: RequestStatus;
  at: string; // ISO timestamp
  note?: string;
}
