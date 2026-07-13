import {
  type EducationEntry,
  type ParsedResume,
} from "~/lib/domain";
import {
  type AIService,
  type AtsResult,
  type ListingSignal,
  type MatchCandidate,
  type MatchResult,
  type ReferralSuccessResult,
  type SeekerSignal,
  type SkillGapResult,
} from "./types";

/**
 * A broad-but-finite skill vocabulary used to extract skills from free text.
 * A real implementation would delegate to an LLM; this keeps parsing deterministic.
 */
const SKILL_VOCAB = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c++",
  "c#",
  "go",
  "rust",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "scala",
  "react",
  "next.js",
  "vue",
  "angular",
  "svelte",
  "node.js",
  "express",
  "django",
  "flask",
  "spring",
  "rails",
  ".net",
  "graphql",
  "rest",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "elasticsearch",
  "kafka",
  "rabbitmq",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "terraform",
  "ci/cd",
  "jenkins",
  "git",
  "linux",
  "html",
  "css",
  "tailwind",
  "sass",
  "figma",
  "machine learning",
  "deep learning",
  "tensorflow",
  "pytorch",
  "pandas",
  "numpy",
  "data analysis",
  "sql",
  "tableau",
  "power bi",
  "excel",
  "product management",
  "agile",
  "scrum",
  "jira",
  "communication",
  "leadership",
];

const DEGREE_KEYWORDS = [
  "b.tech",
  "btech",
  "b.e",
  "bachelor",
  "b.sc",
  "bsc",
  "m.tech",
  "mtech",
  "master",
  "m.sc",
  "msc",
  "mba",
  "phd",
];

/** Deterministic 0..1 hash so mock scores are stable for the same inputs. */
function stableUnit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found = SKILL_VOCAB.filter((skill) => lower.includes(skill));
  return Array.from(new Set(found));
}

function normalize(skill: string): string {
  return skill.trim().toLowerCase();
}

export class MockAIService implements AIService {
  parseResume(input: {
    text: string;
    fileName: string;
  }): Promise<ParsedResume> {
    const { text } = input;
    const lower = text.toLowerCase();

    const email = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(text)?.[0];
    const phone = /(\+?\d[\d\s-]{8,}\d)/.exec(text)?.[0]?.trim();

    const skills = extractSkills(text);

    // Years of experience — pick the largest "N years" mention, else estimate.
    const yearMatches = [...text.matchAll(/(\d{1,2})\s*\+?\s*years?/gi)].map(
      (m) => Number(m[1]),
    );
    const yearsExperience = yearMatches.length
      ? Math.max(...yearMatches)
      : Math.min(10, Math.round(skills.length / 3));

    const education: EducationEntry[] = [];
    for (const kw of DEGREE_KEYWORDS) {
      if (lower.includes(kw)) {
        education.push({ institution: "", degree: kw.toUpperCase() });
        break;
      }
    }

    const certifications: string[] = [];
    if (lower.includes("certified") || lower.includes("certification")) {
      certifications.push("Professional Certification");
    }

    const firstLine = text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0);

    return Promise.resolve({
      fullName: firstLine && firstLine.length < 60 ? firstLine : undefined,
      email,
      phone,
      headline: undefined,
      location: undefined,
      yearsExperience,
      skills,
      education,
      certifications,
      projects: [],
      workHistory: [],
    });
  }

  scoreAts(input: {
    resume: ParsedResume;
    targetRole?: string;
  }): Promise<AtsResult> {
    const { resume } = input;
    const skillScore = Math.min(30, resume.skills.length * 3);
    const expScore = Math.min(25, (resume.yearsExperience ?? 0) * 3);
    const eduScore = resume.education.length > 0 ? 20 : 6;
    const contactScore = (resume.email ? 8 : 0) + (resume.phone ? 7 : 0);
    const certScore = Math.min(10, resume.certifications.length * 5);

    const breakdown = [
      { label: "Skills coverage", score: skillScore, max: 30 },
      { label: "Experience", score: expScore, max: 25 },
      { label: "Education", score: eduScore, max: 20 },
      { label: "Contact & formatting", score: contactScore, max: 15 },
      { label: "Certifications", score: certScore, max: 10 },
    ];
    const score = breakdown.reduce((sum, b) => sum + b.score, 0);

    const suggestions: string[] = [];
    if (resume.skills.length < 8)
      suggestions.push("Add more relevant technical skills and keywords.");
    if (!resume.phone)
      suggestions.push("Include a phone number for recruiter contact.");
    if (resume.education.length === 0)
      suggestions.push("List your education and qualifications.");
    if (resume.certifications.length === 0)
      suggestions.push("Add certifications to strengthen credibility.");
    if (suggestions.length === 0)
      suggestions.push("Strong resume — tailor keywords to each target role.");

    return Promise.resolve({ score, breakdown, suggestions });
  }

  skillGap(input: {
    seekerSkills: string[];
    targetSkills: string[];
  }): Promise<SkillGapResult> {
    const seeker = new Set(input.seekerSkills.map(normalize));
    const target = input.targetSkills.map(normalize);
    const uniqueTarget = Array.from(new Set(target));

    const matched = uniqueTarget.filter((s) => seeker.has(s));
    const missing = uniqueTarget.filter((s) => !seeker.has(s));
    const matchPercent = uniqueTarget.length
      ? Math.round((matched.length / uniqueTarget.length) * 100)
      : 100;

    const recommendations = missing
      .slice(0, 4)
      .map((s) => `Build hands-on experience with ${s}.`);

    return Promise.resolve({
      matched,
      missing,
      matchPercent,
      recommendations,
    });
  }

  matchReferrals(input: {
    seeker: SeekerSignal;
    listings: MatchCandidate[];
  }): Promise<MatchResult[]> {
    const seekerSkills = new Set(input.seeker.skills.map(normalize));

    const results = input.listings.map((listing) => {
      const listingSkills = listing.skills.map(normalize);
      const overlap = listingSkills.filter((s) => seekerSkills.has(s));
      const skillPct = listingSkills.length
        ? overlap.length / listingSkills.length
        : 0.5;

      const sameLevel =
        listing.experienceLevel === input.seeker.experienceLevel;
      const sameLocation =
        !!listing.location &&
        !!input.seeker.location &&
        listing.location.toLowerCase() === input.seeker.location.toLowerCase();

      let score = skillPct * 65;
      if (sameLevel) score += 20;
      if (sameLocation) score += 15;
      // Small deterministic jitter so equal candidates don't tie identically.
      score += stableUnit(listing.listingId + input.seeker.headline) * 5;
      score = Math.round(Math.min(100, score));

      const reasons: string[] = [];
      if (overlap.length)
        reasons.push(`${overlap.length} matching skill(s): ${overlap.join(", ")}`);
      if (sameLevel) reasons.push("Experience level aligns");
      if (sameLocation) reasons.push("Same location");
      if (reasons.length === 0) reasons.push("Partial profile alignment");

      return { listingId: listing.listingId, score, reasons };
    });

    return Promise.resolve(results.sort((a, b) => b.score - a.score));
  }

  generateCoverLetter(input: {
    seeker: SeekerSignal;
    listing: ListingSignal;
    seekerName: string;
  }): Promise<string> {
    const { seeker, listing, seekerName } = input;
    const topSkills = seeker.skills.slice(0, 5).join(", ") || "my skill set";
    const letter = `Dear ${listing.company} Team,

I'm writing to express my strong interest in the ${
      listing.jobTitle ?? listing.role
    } role at ${listing.company}. With ${
      seeker.yearsExperience
    } years of experience and a background in ${topSkills}, I'm confident I can contribute meaningfully to your team.

${
  seeker.careerGoals
    ? `My career focus is ${seeker.careerGoals}, which aligns closely with this opportunity. `
    : ""
}I've built a track record delivering results and continuously growing my expertise, and I'm excited about the impact I could have at ${
      listing.company
    }.

I would greatly appreciate the opportunity to be referred for this role. Thank you for your time and consideration.

Warm regards,
${seekerName}`;
    return Promise.resolve(letter);
  }

  predictReferralSuccess(input: {
    seeker: SeekerSignal;
    listing: ListingSignal;
  }): Promise<ReferralSuccessResult> {
    const seekerSkills = new Set(input.seeker.skills.map(normalize));
    const listingSkills = input.listing.skills.map(normalize);
    const overlap = listingSkills.filter((s) => seekerSkills.has(s)).length;
    const skillPct = listingSkills.length
      ? overlap / listingSkills.length
      : 0.5;

    const sameLevel =
      input.listing.experienceLevel === input.seeker.experienceLevel;

    let score = 30 + skillPct * 50 + (sameLevel ? 15 : 0);
    score = Math.round(Math.min(97, Math.max(15, score)));

    const factors: ReferralSuccessResult["factors"] = [
      {
        label:
          skillPct > 0.5 ? "Strong skill match" : "Limited skill overlap",
        impact: skillPct > 0.5 ? "positive" : "negative",
      },
      {
        label: sameLevel
          ? "Experience level fits the role"
          : "Experience level differs",
        impact: sameLevel ? "positive" : "neutral",
      },
      {
        label: `${input.seeker.yearsExperience} years of experience`,
        impact: input.seeker.yearsExperience >= 2 ? "positive" : "neutral",
      },
    ];

    return Promise.resolve({ score, factors });
  }
}
