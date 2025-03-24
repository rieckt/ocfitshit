import db from "@/db";
import {
    challenges,
    leaderboards,
    seasons
} from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, publicProcedure } from "../procedures";
import { router } from "../server";

export const challengeRouter = router({
  // Public procedure - list active challenges with season info
  listActive: publicProcedure.query(async () => {
    const now = new Date();

    const activeChallenges = await db.query.challenges.findMany({
      where: and(lte(challenges.startsAt, now), gte(challenges.endsAt, now)),
      orderBy: (challenges, { asc }) => [asc(challenges.endsAt)],
      with: {
        season: true,
      },
    });

    return activeChallenges;
  }),

  // Public procedure - get challenge by ID with full details
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const { id } = input;

      const challenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, id),
        with: {
          season: true,
          exerciseLogs: {
            with: {
              user: true,
              exercise: {
                with: {
                  difficulty: true,
                  categories: {
                    with: {
                      category: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      return challenge;
    }),

  // Public procedure - get challenge leaderboard
  getLeaderboard: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(10),
        cursor: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { id, limit, cursor } = input;

      const leaderboardEntries = await db.query.leaderboards.findMany({
        where: eq(leaderboards.challengeId, id),
        limit: limit + 1,
        offset: cursor,
        orderBy: (leaderboards, { desc }) => [desc(leaderboards.points)],
        with: {
          user: true,
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (leaderboardEntries.length > limit) {
        const nextItem = leaderboardEntries.pop();
        nextCursor = cursor ? cursor + limit : limit;
      }

      return {
        items: leaderboardEntries,
        nextCursor,
      };
    }),

  // Admin procedure - create a new challenge
  create: adminProcedure
    .input(
      z.object({
        seasonId: z.string().uuid(),
        name: z.string().min(1, "Challenge name is required"),
        description: z.string(),
        startsAt: z.date(),
        endsAt: z.date(),
        isTeamBased: z.boolean().default(false),
        pointsMultiplier: z.number().positive().default(1),
      }),
    )
    .mutation(async ({ input }) => {
      const {
        seasonId,
        name,
        description,
        startsAt,
        endsAt,
        isTeamBased,
        pointsMultiplier,
      } = input;

      // Validate dates
      if (startsAt >= endsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      // Check if season exists
      const season = await db.query.seasons.findFirst({
        where: eq(seasons.id, seasonId),
      });

      if (!season) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Season not found",
        });
      }

      // Create new challenge
      const [challenge] = await db
        .insert(challenges)
        .values({
          seasonId,
          name,
          description,
          startsAt,
          endsAt,
          isTeamBased,
          pointsMultiplier,
        })
        .returning();

      return challenge;
    }),

  // Admin procedure - update challenge
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1, "Challenge name is required").optional(),
        description: z.string().optional(),
        startsAt: z.date().optional(),
        endsAt: z.date().optional(),
        isTeamBased: z.boolean().optional(),
        pointsMultiplier: z.number().positive().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      // Check if challenge exists
      const existingChallenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, id),
      });

      if (!existingChallenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      // Validate dates if provided
      if (updateData.startsAt && updateData.endsAt) {
        if (updateData.startsAt >= updateData.endsAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Start date must be before end date",
          });
        }
      } else if (updateData.startsAt && existingChallenge.endsAt && updateData.startsAt >= existingChallenge.endsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      } else if (updateData.endsAt && existingChallenge.startsAt && existingChallenge.startsAt >= updateData.endsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      // Update challenge
      const [updatedChallenge] = await db
        .update(challenges)
        .set(updateData)
        .where(eq(challenges.id, id))
        .returning();

      return updatedChallenge;
    }),

  // Admin procedure - delete challenge
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const [deletedChallenge] = await db
        .delete(challenges)
        .where(eq(challenges.id, id))
        .returning();

      if (!deletedChallenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      return deletedChallenge;
    }),
});
