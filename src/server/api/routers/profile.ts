import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  EXPERIENCE_LEVELS,
  VERIFICATION_METHODS,
  WORK_MODES,
} from "~/lib/domain";
import {
  createTRPCRouter,
  employeeProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { type db as Database } from "~/server/db";
import {
  employeeProfiles,
  seekerProfiles,
  users,
} from "~/server/db/schema";

const educationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  startYear: z.number().int().optional(),
  endYear: z.number().int().optional(),
});

const projectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
});

const seekerInput = z.object({
  headline: z.string().max(160).optional(),
  location: z.string().max(120).optional(),
  workModePreference: z.enum(WORK_MODES).optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  skills: z.array(z.string()).max(100).optional(),
  education: z.array(educationSchema).optional(),
  certifications: z.array(z.string()).optional(),
  projects: z.array(projectSchema).optional(),
  careerGoals: z.string().max(1000).optional(),
  targetCompanies: z.array(z.string()).optional(),
  openToRelocate: z.boolean().optional(),
});

const employeeInput = z.object({
  company: z.string().min(1).max(160),
  companyDomain: z.string().max(160).optional(),
  department: z.string().max(120).optional(),
  title: z.string().max(160).optional(),
  location: z.string().max(120).optional(),
  workMode: z.enum(WORK_MODES).optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  bio: z.string().max(1000).optional(),
  linkedinUrl: z.string().url().max(500).optional(),
});

export const profileRouter = createTRPCRouter({
  /** Everything the app shell needs for the signed-in user. */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;
    const [user, seeker, employee] = await Promise.all([
      ctx.db.query.users.findFirst({ where: eq(users.id, uid) }),
      ctx.db.query.seekerProfiles.findFirst({
        where: eq(seekerProfiles.userId, uid),
      }),
      ctx.db.query.employeeProfiles.findFirst({
        where: eq(employeeProfiles.userId, uid),
      }),
    ]);
    return { user, seeker, employee };
  }),

  /**
   * Onboarding: lock in a role and seed the matching profile. Idempotent —
   * re-running updates the role and profile fields.
   */
  completeOnboarding: protectedProcedure
    .input(
      z.discriminatedUnion("role", [
        z.object({ role: z.literal("seeker"), seeker: seekerInput }),
        z.object({ role: z.literal("employee"), employee: employeeInput }),
      ]),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;

      await ctx.db
        .update(users)
        .set({ role: input.role, onboardedAt: new Date() })
        .where(eq(users.id, uid));

      if (input.role === "seeker") {
        await upsertSeeker(ctx.db, uid, input.seeker);
      } else {
        await upsertEmployee(ctx.db, uid, input.employee);
      }
      return { ok: true };
    }),

  updateSeeker: protectedProcedure
    .input(seekerInput)
    .mutation(async ({ ctx, input }) => {
      await upsertSeeker(ctx.db, ctx.session.user.id, input);
      return { ok: true };
    }),

  updateEmployee: protectedProcedure
    .input(employeeInput)
    .mutation(async ({ ctx, input }) => {
      await upsertEmployee(ctx.db, ctx.session.user.id, input);
      return { ok: true };
    }),

  /**
   * Verification stub. A real build would send an OTP to the work email or run
   * a LinkedIn OAuth check; here we auto-approve company-domain / LinkedIn
   * methods so the referral loop is exercisable end-to-end.
   */
  submitVerification: employeeProcedure
    .input(
      z.object({
        method: z.enum(VERIFICATION_METHODS),
        workEmail: z.string().email().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.db.query.employeeProfiles.findFirst({
        where: eq(employeeProfiles.userId, ctx.session.user.id),
      });
      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Create an employee profile first.",
        });
      }

      const autoApprove =
        input.method === "company_email" ||
        input.method === "work_email_otp" ||
        input.method === "linkedin";

      await ctx.db
        .update(employeeProfiles)
        .set({
          verificationMethod: input.method,
          verificationStatus: autoApprove ? "verified" : "pending",
          verifiedAt: autoApprove ? new Date() : null,
        })
        .where(eq(employeeProfiles.userId, ctx.session.user.id));

      return { status: autoApprove ? "verified" : "pending" };
    }),

  /** Public employee profile with reputation, for listing/detail pages. */
  employeePublic: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.query.employeeProfiles.findFirst({
        where: eq(employeeProfiles.userId, input.userId),
        with: { user: { columns: { name: true, image: true } } },
      });
      if (!profile) return null;
      const rating =
        profile.ratingCount > 0
          ? Math.round((profile.ratingSum / profile.ratingCount) * 10) / 10
          : null;
      return { ...profile, rating };
    }),
});

// --- shared upsert helpers ---

async function upsertSeeker(
  db: typeof Database,
  userId: string,
  input: z.infer<typeof seekerInput>,
) {
  const existing = await db.query.seekerProfiles.findFirst({
    where: eq(seekerProfiles.userId, userId),
  });
  if (existing) {
    await db
      .update(seekerProfiles)
      .set(input)
      .where(eq(seekerProfiles.userId, userId));
  } else {
    await db.insert(seekerProfiles).values({ userId, ...input });
  }
}

async function upsertEmployee(
  db: typeof Database,
  userId: string,
  input: z.infer<typeof employeeInput>,
) {
  const existing = await db.query.employeeProfiles.findFirst({
    where: eq(employeeProfiles.userId, userId),
  });
  if (existing) {
    await db
      .update(employeeProfiles)
      .set(input)
      .where(eq(employeeProfiles.userId, userId));
  } else {
    await db.insert(employeeProfiles).values({ userId, ...input });
  }
}
