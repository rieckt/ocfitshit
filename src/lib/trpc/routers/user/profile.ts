import db from "@/db";
import { userProfiles } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { loggerMiddleware } from "../../middleware";
import { protectedProcedure } from "../../procedures";
import { idSchema } from "../../schemas/common";
import { router } from "../../server";

/**
 * Profile router
 * Handles all profile-related operations
 */
export const profileRouter = router({
  // Get current user's profile
  get: protectedProcedure
    .use(loggerMiddleware)
    .query(async ({ ctx }) => {
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, ctx.userId),
        with: {
          level: true,
          badges: true,
          teamMembers: {
            with: {
              team: true,
            },
          },
        },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
          cause: { userId: ctx.userId },
        });
      }

      return profile;
    }),

  // Get profile by ID
  getById: protectedProcedure
    .input(idSchema)
    .use(loggerMiddleware)
    .query(async ({ input }) => {
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, input.id),
        with: {
          level: true,
          badges: true,
          teamMembers: {
            with: {
              team: true,
            },
          },
        },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
          cause: { userId: input.id },
        });
      }

      return profile;
    }),

  // Update profile
  update: protectedProcedure
    .input(z.object({
      displayName: z.string().min(2).max(50).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .use(loggerMiddleware)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(userProfiles)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, ctx.userId))
        .returning();

      return updated;
    }),
});
