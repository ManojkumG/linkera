import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { sanitizeResumeText } from "~/lib/utils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { resumes, seekerProfiles } from "~/server/db/schema";
import { ai } from "~/server/services/ai";

export const resumeRouter = createTRPCRouter({
  /**
   * Upload a resume. The client sends the extracted plain text (for PDF/DOC a
   * parser runs client-side or a real service extracts it); we run AI parsing
   * + ATS scoring and store the structured result.
   */
  upload: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        mimeType: z.string().max(128).optional(),
        content: z.string().min(1).max(200_000),
        applyToProfile: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const content = sanitizeResumeText(input.content);
      if (!content.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Resume content is empty after sanitization.",
        });
      }

      const parsed = await ai.parseResume({
        text: content,
        fileName: input.fileName,
      });
      const ats = await ai.scoreAts({ resume: parsed });

      const existingCount = await ctx.db.query.resumes.findMany({
        where: eq(resumes.userId, uid),
        columns: { id: true },
      });

      const [row] = await ctx.db
        .insert(resumes)
        .values({
          userId: uid,
          fileName: input.fileName,
          mimeType: input.mimeType,
          content,
          parsed,
          atsScore: ats.score,
          isPrimary: existingCount.length === 0,
        })
        .returning();

      if (input.applyToProfile) {
        const seeker = await ctx.db.query.seekerProfiles.findFirst({
          where: eq(seekerProfiles.userId, uid),
        });
        const mergedSkills = Array.from(
          new Set([...(seeker?.skills ?? []), ...parsed.skills]),
        );
        if (seeker) {
          await ctx.db
            .update(seekerProfiles)
            .set({
              skills: mergedSkills,
              yearsExperience:
                (seeker.yearsExperience ?? 0) || (parsed.yearsExperience ?? 0),
              education:
                seeker.education?.length
                  ? seeker.education
                  : parsed.education,
              certifications:
                seeker.certifications?.length
                  ? seeker.certifications
                  : parsed.certifications,
            })
            .where(eq(seekerProfiles.userId, uid));
        } else {
          await ctx.db.insert(seekerProfiles).values({
            userId: uid,
            skills: parsed.skills,
            yearsExperience: parsed.yearsExperience ?? 0,
            education: parsed.education,
            certifications: parsed.certifications,
          });
        }
      }

      return { resume: row, parsed, ats };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.resumes.findMany({
      where: eq(resumes.userId, ctx.session.user.id),
      orderBy: [desc(resumes.isPrimary), desc(resumes.createdAt)],
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.resumes.findFirst({
        where: eq(resumes.id, input.id),
      });
      // Owner or the employee reviewing an attached request may read; here we
      // restrict to owner and let the request router expose reviewer access.
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      if (row.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return row;
    }),

  setPrimary: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const row = await ctx.db.query.resumes.findFirst({
        where: and(eq(resumes.id, input.id), eq(resumes.userId, uid)),
      });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db
        .update(resumes)
        .set({ isPrimary: false })
        .where(eq(resumes.userId, uid));
      await ctx.db
        .update(resumes)
        .set({ isPrimary: true })
        .where(eq(resumes.id, input.id));
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(resumes)
        .where(
          and(
            eq(resumes.id, input.id),
            eq(resumes.userId, ctx.session.user.id),
          ),
        );
      return { ok: true };
    }),

  /** Re-run ATS scoring against an optional target role. */
  ats: protectedProcedure
    .input(z.object({ id: z.string(), targetRole: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.resumes.findFirst({
        where: and(
          eq(resumes.id, input.id),
          eq(resumes.userId, ctx.session.user.id),
        ),
      });
      if (!row?.parsed) throw new TRPCError({ code: "NOT_FOUND" });
      return ai.scoreAts({ resume: row.parsed, targetRole: input.targetRole });
    }),
});
