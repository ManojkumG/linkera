import { type ParsedResume } from "~/lib/domain";

export interface AtsResult {
  score: number; // 0-100
  breakdown: { label: string; score: number; max: number }[];
  suggestions: string[];
}

export interface SkillGapResult {
  matched: string[];
  missing: string[];
  matchPercent: number; // 0-100
  recommendations: string[];
}

export interface ReferralSuccessResult {
  score: number; // 0-100
  factors: { label: string; impact: "positive" | "neutral" | "negative" }[];
}

export interface MatchCandidate {
  listingId: string;
  company: string;
  role: string;
  skills: string[];
  experienceLevel: string;
  location: string | null;
}

export interface MatchResult {
  listingId: string;
  score: number; // 0-100
  reasons: string[];
}

/** Minimal seeker signal the AI services need — kept decoupled from the DB row. */
export interface SeekerSignal {
  skills: string[];
  yearsExperience: number;
  experienceLevel: string;
  location?: string | null;
  careerGoals?: string | null;
  headline?: string | null;
}

export interface ListingSignal {
  role: string;
  jobTitle?: string | null;
  company: string;
  skills: string[];
  experienceLevel: string;
  location?: string | null;
}

/**
 * The full AI surface for the platform. The rest of the app depends only on this
 * interface — swap the mock implementation for a real Claude/OpenAI-backed one
 * without touching any router or page.
 */
export interface AIService {
  parseResume(input: { text: string; fileName: string }): Promise<ParsedResume>;
  scoreAts(input: {
    resume: ParsedResume;
    targetRole?: string;
  }): Promise<AtsResult>;
  skillGap(input: {
    seekerSkills: string[];
    targetSkills: string[];
  }): Promise<SkillGapResult>;
  matchReferrals(input: {
    seeker: SeekerSignal;
    listings: MatchCandidate[];
  }): Promise<MatchResult[]>;
  generateCoverLetter(input: {
    seeker: SeekerSignal;
    listing: ListingSignal;
    seekerName: string;
  }): Promise<string>;
  predictReferralSuccess(input: {
    seeker: SeekerSignal;
    listing: ListingSignal;
  }): Promise<ReferralSuccessResult>;
}
