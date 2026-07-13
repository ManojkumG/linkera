import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const authRouter = createTRPCRouter({
  /** Register with email + password. Role is chosen during onboarding. */
  signup: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(120),
        email: z.string().email(),
        password: z.string().min(8).max(200),
        role: z.enum(["seeker", "employee"]).default("seeker"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      await ctx.db.insert(users).values({
        name: input.name,
        email,
        passwordHash,
        role: input.role,
      });

      return { ok: true };
    }),

  /** Current session user with role — used by client-side guards. */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        onboardedAt: true,
      },
    });
    return user ?? null;
  }),
});
