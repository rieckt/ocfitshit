import db from "@/db";
import { challenges, leaderboards, seasons } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, publicProcedure } from "../procedures";
import { router } from "../server";

export const seasonRouter = router({
  // Public procedure - list active seasons
  listActive: publicProcedure.query(async () => {
    const now = new Date();

    const activeSeasons = await db.query.seasons.findMany({
      where: and(
        lte(seasons.startsAt, now),
        gte(seasons.endsAt, now),
        eq(seasons.isActive, true)
      ),
      orderBy: (seasons, { asc }) => [asc(seasons.endsAt)],
      with: {
        challenges: {
          where: and(
            lte(challenges.startsAt, now),
            gte(challenges.endsAt, now)
          ),
        },
      },
    });

    return activeSeasons;
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
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      const { name, startsAt, endsAt, isActive } = input;

      // Validate dates
      if (startsAt >= endsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      // Check for overlapping active seasons
      if (isActive) {
        const overlappingSeasons = await db.query.seasons.findMany({
          where: and(
            eq(seasons.isActive, true),
            lte(seasons.startsAt, endsAt),
            gte(seasons.endsAt, startsAt)
          ),
        });

        if (overlappingSeasons.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "There is already an active season during this time period",
          });
        }
      }

      // Create new season
      const [season] = await db
        .insert(seasons)
        .values({
          name,
          startsAt,
          endsAt,
          isActive,
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
        isActive: z.boolean().optional(),
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
      } else if (updateData.startsAt && updateData.startsAt >= existingSeason.endsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      } else if (updateData.endsAt && existingSeason.startsAt >= updateData.endsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      // Check for overlapping active seasons if updating active status or dates
      if (
        (updateData.isActive === true || existingSeason.isActive) &&
        (updateData.startsAt || updateData.endsAt)
      ) {
        const overlappingSeasons = await db.query.seasons.findMany({
          where: and(
            eq(seasons.isActive, true),
            lte(
              seasons.startsAt,
              updateData.endsAt || existingSeason.endsAt
            ),
            gte(
              seasons.endsAt,
              updateData.startsAt || existingSeason.startsAt
            ),
            eq(seasons.id, id)
          ),
        });

        if (overlappingSeasons.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "There is already an active season during this time period",
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
