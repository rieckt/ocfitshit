import db from "@/db";
import { challenges, exercises, userProfiles } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure } from "../procedures";
import { router } from "../server";

export const challengeRouter = router({
	// Public procedure - list active challenges
	listActive: publicProcedure
		.query(async () => {
			const now = new Date();

			const activeChalllenges = await db.query.challenges.findMany({
				where: and(
					lte(challenges.startsAt, now),
					gte(challenges.endsAt, now)
				),
				orderBy: (challenges, { asc }) => [asc(challenges.endsAt)],
			});

			return activeChalllenges;
		}),

	// Public procedure - get challenge by ID
	getById: publicProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input }) => {
			const { id } = input;

			const challenge = await db.query.challenges.findFirst({
				where: eq(challenges.id, id),
			});

			return challenge;
		}),

	// Protected procedure - log exercise for a challenge
	logExercise: protectedProcedure
		.input(z.object({
			challengeId: z.string().uuid(),
			exerciseTypeId: z.number(),
			value: z.number().positive(),
			metadata: z.record(z.unknown()).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { userId } = ctx;
			const { challengeId, exerciseTypeId, value, metadata } = input;

			// Check if challenge exists and is active
			const challenge = await db.query.challenges.findFirst({
				where: eq(challenges.id, challengeId),
			});

			if (!challenge) {
				throw new Error("Challenge not found");
			}

			const now = new Date();
			if (challenge.startsAt && challenge.endsAt && (challenge.startsAt > now || challenge.endsAt < now)) {
				throw new Error("Challenge is not active");
			}

			// Calculate points (example: 1 point per unit of exercise)
			const points = value;

			// Insert exercise record
			const [exercise] = await db
				.insert(exercises)
				.values({
					userId,
					challengeId,
					exerciseTypeId,
					value,
					points,
					metadata: metadata || {},
				})
				.returning();

			// Update user's total points
			const userProfile = await db.query.userProfiles.findFirst({
				where: eq(userProfiles.userId, userId),
			});

			if (userProfile) {
				const newTotalPoints = (userProfile.totalPoints || 0) + points;
				const newLevel = Math.floor(newTotalPoints / 100) + 1;

				await db
					.update(userProfiles)
					.set({
						totalPoints: newTotalPoints,
						level: newLevel,
					})
					.where(eq(userProfiles.userId, userId));
			}

			return { success: true, exercise };
		}),

	// Admin procedure - create a new challenge
	create: adminProcedure
		.input(z.object({
			seasonId: z.string().uuid(),
			name: z.string(),
			description: z.string(),
			startsAt: z.date(),
			endsAt: z.date(),
			isTeamBased: z.boolean().default(false),
		}))
		.mutation(async ({ input }) => {
			const { seasonId, name, description, startsAt, endsAt, isTeamBased } = input;

			// Validate dates
			if (startsAt >= endsAt) {
				throw new Error("Start date must be before end date");
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
				})
				.returning();

			return { success: true, challenge };
		}),
});
