import db from "@/db";
import { challenges, leaderboards, seasons } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, publicProcedure } from "../procedures";
import { router } from "../server";

export const seasonRouter = router({
  // Public procedure - list all seasons
  listActive: publicProcedure.query(async () => {
    const now = new Date();

    const allSeasons = await db.query.seasons.findMany({
      orderBy: (seasons, { asc }) => [asc(seasons.startsAt)],
      with: {
        challenges: {
          where: and(
            lte(challenges.startsAt, now),
            gte(challenges.endsAt, now)
          ),
        },
      },
    });

    return allSeasons;
  }),

  // Public procedure - get season by ID with full details
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const { id } = input;

      const season = await db.query.seasons.findFirst({
        where: eq(seasons.id, id),
        with: {
          challenges: {
            orderBy: (challenges, { asc }) => [asc(challenges.startsAt)],
          },
        },
      });

      if (!season) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Season not found",
        });
      }

      return season;
    }),

  // Public procedure - get season leaderboard
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
        where: eq(leaderboards.seasonId, id),
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

  // Admin procedure - create a new season
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Season name is required"),
        startsAt: z.date(),
        endsAt: z.date(),
      }),
    )
    .mutation(async ({ input }) => {
      const { name, startsAt, endsAt } = input;

      // Validate dates
      if (startsAt >= endsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      // Create new season
      const [season] = await db
        .insert(seasons)
        .values({
          name,
          startsAt,
          endsAt,
        })
        .returning();

      return season;
    }),

  // Admin procedure - update season
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1, "Season name is required").optional(),
        startsAt: z.date().optional(),
        endsAt: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      // Check if season exists
      const existingSeason = await db.query.seasons.findFirst({
        where: eq(seasons.id, id),
      });

      if (!existingSeason) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Season not found",
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
      }

      // Update season
      const [updatedSeason] = await db
        .update(seasons)
        .set(updateData)
        .where(eq(seasons.id, id))
        .returning();

      return updatedSeason;
    }),

  // Admin procedure - delete season
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const [deletedSeason] = await db
        .delete(seasons)
        .where(eq(seasons.id, id))
        .returning();

      if (!deletedSeason) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Season not found",
        });
      }

      return deletedSeason;
    }),
});
