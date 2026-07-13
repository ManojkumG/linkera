import { and, desc, eq, ne } from "drizzle-orm";

import { type RequestStatus } from "~/lib/domain";
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
import { ai, type MatchCandidate } from "~/server/services/ai";

function tally(statuses: RequestStatus[]) {
  return statuses.reduce<Record<string, number>>((acc, s) => {
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
}

export const dashboardRouter = createTRPCRouter({
  seeker: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;
    const requests = await ctx.db.query.referralRequests.findMany({
      where: eq(referralRequests.seekerId, uid),
      columns: { status: true, successScore: true },
    });

    const byStatus = tally(requests.map((r) => r.status));
    const total = requests.length;
    const active = requests.filter(
      (r) => r.status !== "rejected" && r.status !== "hired",
    ).length;
    const referred = requests.filter(
      (r) =>
        r.status === "referred" ||
        r.status === "accepted" ||
        r.status === "hired",
    ).length;

    return {
      total,
      active,
      referred,
      hired: byStatus.hired ?? 0,
      byStatus,
    };
  }),

  /** AI-ranked referral recommendations for the signed-in seeker. */
  recommendations: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;
    const seeker = await ctx.db.query.seekerProfiles.findFirst({
      where: eq(seekerProfiles.userId, uid),
    });

    const listings = await ctx.db.query.referralListings.findMany({
      where: and(
        eq(referralListings.isActive, true),
        ne(referralListings.employeeId, uid),
      ),
      orderBy: [desc(referralListings.createdAt)],
      limit: 50,
      with: {
        employee: {
          columns: { id: true, name: true, image: true },
          with: { employeeProfile: true },
        },
      },
    });

    const candidates: MatchCandidate[] = listings.map((l) => ({
      listingId: l.id,
      company: l.company,
      role: l.role,
      skills: l.skills ?? [],
      experienceLevel: l.experienceLevel ?? "mid",
      location: l.location,
    }));

    const matches = await ai.matchReferrals({
      seeker: {
        skills: seeker?.skills ?? [],
        yearsExperience: seeker?.yearsExperience ?? 0,
        experienceLevel: seeker?.experienceLevel ?? "entry",
        location: seeker?.location,
        headline: seeker?.headline,
        careerGoals: seeker?.careerGoals,
      },
      listings: candidates,
    });

    const byId = new Map(listings.map((l) => [l.id, l]));
    return matches
      .slice(0, 8)
      .map((m) => ({ ...m, listing: byId.get(m.listingId)! }))
      .filter((m) => m.listing);
  }),

  employee: employeeProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;
    const [requests, listings, profile] = await Promise.all([
      ctx.db.query.referralRequests.findMany({
        where: eq(referralRequests.employeeId, uid),
        columns: { status: true, createdAt: true },
      }),
      ctx.db.query.referralListings.findMany({
        where: eq(referralListings.employeeId, uid),
        columns: {
          isActive: true,
          monthlyLimit: true,
          slotsUsedThisMonth: true,
        },
      }),
      ctx.db.query.employeeProfiles.findFirst({
        where: eq(employeeProfiles.userId, uid),
      }),
    ]);

    const byStatus = tally(requests.map((r) => r.status));
    const pending = requests.filter(
      (r) => r.status === "requested" || r.status === "viewed",
    ).length;
    const referred = profile?.totalReferred ?? 0;
    const hired = profile?.totalHired ?? 0;
    const decided = requests.filter(
      (r) => r.status === "referred" || r.status === "rejected",
    ).length;
    const successRate =
      referred + hired > 0 && requests.length > 0
        ? Math.round(((referred + hired) / requests.length) * 100)
        : null;

    const slotsLeft = listings.reduce(
      (sum, l) => sum + Math.max(0, l.monthlyLimit - l.slotsUsedThisMonth),
      0,
    );

    return {
      totalRequests: requests.length,
      pending,
      referred,
      hired,
      decided,
      successRate,
      activeListings: listings.filter((l) => l.isActive).length,
      slotsLeft,
      rating:
        profile && profile.ratingCount > 0
          ? Math.round((profile.ratingSum / profile.ratingCount) * 10) / 10
          : null,
      verificationStatus: profile?.verificationStatus ?? "unverified",
      byStatus,
    };
  }),
});
