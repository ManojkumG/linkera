import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, lte, sql, type SQL } from "drizzle-orm";
import { z } from "zod";

import { EXPERIENCE_LEVELS, WORK_MODES } from "~/lib/domain";
import {
  createTRPCRouter,
  employeeProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { referralListings } from "~/server/db/schema";

const listingInput = z.object({
  company: z.string().min(1).max(160),
  department: z.string().max(120).optional(),
  role: z.string().min(1).max(160),
  jobTitle: z.string().max(160).optional(),
  location: z.string().max(120).optional(),
  workMode: z.enum(WORK_MODES).default("onsite"),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).default("mid"),
  description: z.string().max(4000).optional(),
  skills: z.array(z.string()).max(50).default([]),
  priceInr: z.number().int().min(0).max(1_000_000).default(0),
  monthlyLimit: z.number().int().min(1).max(100).default(5),
});

export const listingRouter = createTRPCRouter({
  create: employeeProcedure
    .input(listingInput)
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(referralListings)
        .values({ employeeId: ctx.session.user.id, ...input })
        .returning();
      return row;
    }),

  update: employeeProcedure
    .input(listingInput.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      const existing = await ctx.db.query.referralListings.findFirst({
        where: eq(referralListings.id, id),
      });
      if (existing?.employeeId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db
        .update(referralListings)
        .set(patch)
        .where(eq(referralListings.id, id));
      return { ok: true };
    }),

  setActive: employeeProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.referralListings.findFirst({
        where: eq(referralListings.id, input.id),
      });
      if (existing?.employeeId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db
        .update(referralListings)
        .set({ isActive: input.isActive })
        .where(eq(referralListings.id, input.id));
      return { ok: true };
    }),

  /** Listings owned by the signed-in employee. */
  mine: employeeProcedure.query(async ({ ctx }) => {
    return ctx.db.query.referralListings.findMany({
      where: eq(referralListings.employeeId, ctx.session.user.id),
      orderBy: [desc(referralListings.createdAt)],
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.referralListings.findFirst({
        where: eq(referralListings.id, input.id),
        with: {
          employee: {
            columns: { id: true, name: true, image: true },
            with: { employeeProfile: true },
          },
        },
      });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        ...row,
        slotsRemaining: Math.max(0, row.monthlyLimit - row.slotsUsedThisMonth),
      };
    }),

  /** Public search with filters + pagination. */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        company: z.string().optional(),
        department: z.string().optional(),
        role: z.string().optional(),
        location: z.string().optional(),
        workMode: z.enum(WORK_MODES).optional(),
        experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
        maxPrice: z.number().int().optional(),
        availableOnly: z.boolean().default(true),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conds: SQL[] = [eq(referralListings.isActive, true)];

      if (input.availableOnly) {
        conds.push(
          sql`${referralListings.slotsUsedThisMonth} < ${referralListings.monthlyLimit}`,
        );
      }
      if (input.company)
        conds.push(ilike(referralListings.company, `%${input.company}%`));
      if (input.department)
        conds.push(ilike(referralListings.department, `%${input.department}%`));
      if (input.role)
        conds.push(ilike(referralListings.role, `%${input.role}%`));
      if (input.location)
        conds.push(ilike(referralListings.location, `%${input.location}%`));
      if (input.workMode)
        conds.push(eq(referralListings.workMode, input.workMode));
      if (input.experienceLevel)
        conds.push(
          eq(referralListings.experienceLevel, input.experienceLevel),
        );
      if (typeof input.maxPrice === "number")
        conds.push(lte(referralListings.priceInr, input.maxPrice));
      if (input.query) {
        const q = `%${input.query}%`;
        conds.push(
          sql`(${referralListings.company} ILIKE ${q} OR ${referralListings.role} ILIKE ${q} OR ${referralListings.jobTitle} ILIKE ${q})`,
        );
      }

      const where = and(...conds);

      const [items, countRows] = await Promise.all([
        ctx.db.query.referralListings.findMany({
          where,
          orderBy: [desc(referralListings.createdAt)],
          limit: input.limit,
          offset: input.offset,
          with: {
            employee: {
              columns: { id: true, name: true, image: true },
              with: { employeeProfile: true },
            },
          },
        }),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(referralListings)
          .where(where),
      ]);

      return {
        items: items.map((row) => ({
          ...row,
          slotsRemaining: Math.max(
            0,
            row.monthlyLimit - row.slotsUsedThisMonth,
          ),
        })),
        total: countRows[0]?.count ?? 0,
      };
    }),
});
