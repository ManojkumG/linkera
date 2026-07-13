import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import {
  ALLOWED_TRANSITIONS,
  type RequestStatus,
  REQUEST_STATUS_LABELS,
  type StatusHistoryEntry,
  TERMINAL_STATUSES,
} from "~/lib/domain";
import {
  createTRPCRouter,
  employeeProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import {
  employeeProfiles,
  referralListings,
  referralRequests,
  seekerProfiles,
} from "~/server/db/schema";
import { type db as Database } from "~/server/db";
import { ai, type ListingSignal, type SeekerSignal } from "~/server/services/ai";
import { notify } from "~/server/services/notifications";

function seekerSignalFrom(
  profile: typeof seekerProfiles.$inferSelect | undefined,
): SeekerSignal {
  return {
    skills: profile?.skills ?? [],
    yearsExperience: profile?.yearsExperience ?? 0,
    experienceLevel: profile?.experienceLevel ?? "entry",
    location: profile?.location,
    careerGoals: profile?.careerGoals,
    headline: profile?.headline,
  };
}

function listingSignalFrom(
  listing: typeof referralListings.$inferSelect,
): ListingSignal {
  return {
    role: listing.role,
    jobTitle: listing.jobTitle,
    company: listing.company,
    skills: listing.skills ?? [],
    experienceLevel: listing.experienceLevel ?? "mid",
    location: listing.location,
  };
}

export const requestRouter = createTRPCRouter({
  /** Preview an AI cover letter for a listing before submitting a request. */
  draftCoverLetter: protectedProcedure
    .input(z.object({ listingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.query.referralListings.findFirst({
        where: eq(referralListings.id, input.listingId),
      });
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });

      const seeker = await ctx.db.query.seekerProfiles.findFirst({
        where: eq(seekerProfiles.userId, ctx.session.user.id),
      });

      return ai.generateCoverLetter({
        seeker: seekerSignalFrom(seeker),
        listing: listingSignalFrom(listing),
        seekerName: ctx.session.user.name ?? "Candidate",
      });
    }),

  /** Seeker submits a referral request against a listing. */
  create: protectedProcedure
    .input(
      z.object({
        listingId: z.string(),
        resumeId: z.string().optional(),
        message: z.string().max(2000).optional(),
        coverLetter: z.string().max(6000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const listing = await ctx.db.query.referralListings.findFirst({
        where: eq(referralListings.id, input.listingId),
      });
      if (!listing?.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This referral is no longer available.",
        });
      }
      if (listing.employeeId === uid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't request a referral on your own listing.",
        });
      }
      if (listing.slotsUsedThisMonth >= listing.monthlyLimit) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This referrer has no slots left this month.",
        });
      }

      // Prevent duplicate open requests to the same listing.
      const dup = await ctx.db.query.referralRequests.findFirst({
        where: and(
          eq(referralRequests.listingId, input.listingId),
          eq(referralRequests.seekerId, uid),
        ),
      });
      if (dup && !TERMINAL_STATUSES.includes(dup.status)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have an open request for this referral.",
        });
      }

      const seeker = await ctx.db.query.seekerProfiles.findFirst({
        where: eq(seekerProfiles.userId, uid),
      });
      const prediction = await ai.predictReferralSuccess({
        seeker: seekerSignalFrom(seeker),
        listing: listingSignalFrom(listing),
      });

      const history: StatusHistoryEntry[] = [
        { status: "requested", at: new Date().toISOString() },
      ];

      const [row] = await ctx.db
        .insert(referralRequests)
        .values({
          listingId: listing.id,
          seekerId: uid,
          employeeId: listing.employeeId,
          resumeId: input.resumeId,
          message: input.message,
          coverLetter: input.coverLetter,
          priceInr: listing.priceInr,
          // Payment integration is stubbed; free listings count as paid.
          paid: listing.priceInr === 0,
          successScore: prediction.score,
          status: "requested",
          statusHistory: history,
        })
        .returning();

      // Consume a monthly slot.
      await ctx.db
        .update(referralListings)
        .set({ slotsUsedThisMonth: listing.slotsUsedThisMonth + 1 })
        .where(eq(referralListings.id, listing.id));

      await notify(ctx.db, {
        userId: listing.employeeId,
        type: "request_received",
        title: "New referral request",
        body: `A candidate requested a referral for ${listing.role} at ${listing.company}.`,
        link: `/requests/${row!.id}`,
      });

      return row;
    }),

  /** Requests the signed-in seeker has sent. */
  sent: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.referralRequests.findMany({
      where: eq(referralRequests.seekerId, ctx.session.user.id),
      orderBy: [desc(referralRequests.createdAt)],
      with: {
        listing: true,
        employee: { columns: { id: true, name: true, image: true } },
      },
    });
  }),

  /** Requests the signed-in employee has received. */
  received: employeeProcedure.query(async ({ ctx }) => {
    return ctx.db.query.referralRequests.findMany({
      where: eq(referralRequests.employeeId, ctx.session.user.id),
      orderBy: [desc(referralRequests.createdAt)],
      with: {
        listing: true,
        seeker: { columns: { id: true, name: true, image: true } },
        resume: { columns: { id: true, fileName: true, atsScore: true } },
      },
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.referralRequests.findFirst({
        where: eq(referralRequests.id, input.id),
        with: {
          listing: true,
          seeker: { columns: { id: true, name: true, image: true } },
          employee: { columns: { id: true, name: true, image: true } },
          resume: true,
        },
      });
      const uid = ctx.session.user.id;
      if (!row || (row.seekerId !== uid && row.employeeId !== uid)) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Auto-mark viewed the first time the employee opens it.
      if (row.employeeId === uid && row.status === "requested") {
        await applyTransition(ctx.db, row, "viewed", "Opened by referrer");
        row.status = "viewed";
      }

      const seekerProfile = await ctx.db.query.seekerProfiles.findFirst({
        where: eq(seekerProfiles.userId, row.seekerId),
      });
      return { ...row, seekerProfile };
    }),

  /** Employee advances / decides a request. */
  updateStatus: employeeProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "viewed",
          "under_review",
          "referred",
          "accepted",
          "rejected",
          "hired",
        ]),
        note: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db.query.referralRequests.findFirst({
        where: eq(referralRequests.id, input.id),
      });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      if (row.employeeId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (!ALLOWED_TRANSITIONS[row.status].includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Can't move from ${row.status} to ${input.status}.`,
        });
      }

      await applyTransition(ctx.db, row, input.status, input.note);

      // Maintain employee reputation counters.
      if (input.status === "referred") {
        await ctx.db
          .update(employeeProfiles)
          .set({ totalReferred: sql`${employeeProfiles.totalReferred} + 1` })
          .where(eq(employeeProfiles.userId, row.employeeId));
      }
      if (input.status === "hired") {
        await ctx.db
          .update(employeeProfiles)
          .set({ totalHired: sql`${employeeProfiles.totalHired} + 1` })
          .where(eq(employeeProfiles.userId, row.employeeId));
      }

      await notify(ctx.db, {
        userId: row.seekerId,
        type: "request_status",
        title: `Referral ${REQUEST_STATUS_LABELS[input.status]}`,
        body: input.note ?? `Your request is now ${REQUEST_STATUS_LABELS[input.status]}.`,
        link: `/requests/${row.id}`,
      });

      return { ok: true };
    }),

  /** Seeker withdraws an open request (frees a slot). */
  withdraw: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db.query.referralRequests.findFirst({
        where: and(
          eq(referralRequests.id, input.id),
          eq(referralRequests.seekerId, ctx.session.user.id),
        ),
      });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      if (TERMINAL_STATUSES.includes(row.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This request is already closed.",
        });
      }
      await applyTransition(ctx.db, row, "rejected", "Withdrawn by candidate");
      // Return the slot if it hasn't been referred yet.
      if (row.status !== "referred") {
        await ctx.db
          .update(referralListings)
          .set({
            slotsUsedThisMonth: sql`GREATEST(${referralListings.slotsUsedThisMonth} - 1, 0)`,
          })
          .where(eq(referralListings.id, row.listingId));
      }
      return { ok: true };
    }),
});

/** Persist a status change + append to the audit history + stamp timestamps. */
async function applyTransition(
  db: typeof Database,
  row: typeof referralRequests.$inferSelect,
  status: RequestStatus,
  note?: string,
) {
  const history: StatusHistoryEntry[] = [
    ...(row.statusHistory ?? []),
    { status, at: new Date().toISOString(), note },
  ];
  await db
    .update(referralRequests)
    .set({
      status,
      statusHistory: history,
      viewedAt: status === "viewed" ? new Date() : row.viewedAt,
      referredAt: status === "referred" ? new Date() : row.referredAt,
      decidedAt: TERMINAL_STATUSES.includes(status) ? new Date() : row.decidedAt,
    })
    .where(eq(referralRequests.id, row.id));
}
