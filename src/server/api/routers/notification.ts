import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { notifications } from "~/server/db/schema";

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.notifications.findMany({
        where: eq(notifications.userId, ctx.session.user.id),
        orderBy: [desc(notifications.createdAt)],
        limit: input.limit,
      });
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, ctx.session.user.id),
        eq(notifications.isRead, false),
      ),
      columns: { id: true },
    });
    return rows.length;
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.session.user.id),
          ),
        );
      return { ok: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.session.user.id));
    return { ok: true };
  }),
});
