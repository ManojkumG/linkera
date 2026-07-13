import { EXPERIENCE_LEVELS, type ExperienceLevel } from "./domain";

/** Tiny classnames joiner (no dependency). */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function formatInr(amount: number): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.345, "w"],
    [12, "mo"],
    [Number.POSITIVE_INFINITY, "y"],
  ];
  let value = seconds;
  let unit = "s";
  for (const [factor, label] of units) {
    if (Math.abs(value) < factor) {
      unit = label;
      break;
    }
    value = value / factor;
    unit = label;
  }
  const rounded = Math.floor(value);
  return rounded <= 0 ? "just now" : `${rounded}${unit} ago`;
}

export function sanitizeResumeText(input: string): string {
  return input
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/\r\n?/g, "\n");
}

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  internship: "Internship",
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior",
  lead: "Lead",
  principal: "Principal",
};

export function experienceLabel(level: string): string {
  return EXPERIENCE_LABELS[level as ExperienceLevel] ?? level;
}

export const EXPERIENCE_OPTIONS = EXPERIENCE_LEVELS.map((value) => ({
  value,
  label: EXPERIENCE_LABELS[value],
}));

export function workModeLabel(mode?: string | null): string {
  switch (mode) {
    case "remote":
      return "Remote";
    case "hybrid":
      return "Hybrid";
    case "onsite":
      return "On-site";
    default:
      return "—";
  }
}
