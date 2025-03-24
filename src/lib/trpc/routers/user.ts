import db from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure } from "../procedures";
import { router } from "../server";

export const userRouter = router({
	// Public procedure - get user by ID
	getById: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ input }) => {
			const { userId } = input;

			const user = await db.query.userProfiles.findFirst({
				where: eq(userProfiles.userId, userId),
			});

			return user;
		}),

	// Protected procedure - get current user profile
	getProfile: protectedProcedure
		.query(async ({ ctx }) => {
			const { userId } = ctx;

			const profile = await db.query.userProfiles.findFirst({
				where: eq(userProfiles.userId, userId),
			});

			return profile;
		}),

	// Protected procedure - update user points
	updatePoints: protectedProcedure
		.input(z.object({ points: z.number().min(0) }))
		.mutation(async ({ ctx, input }) => {
			const { userId } = ctx;
			const { points } = input;

			// Get current profile
			const currentProfile = await db.query.userProfiles.findFirst({
				where: eq(userProfiles.userId, userId),
			});

			if (!currentProfile) {
				throw new Error("User profile not found");
			}

			// Calculate new total points
			const newTotalPoints = (currentProfile.totalPoints || 0) + points;

			// Calculate new level (example: 1 level per 100 points)
			const newLevel = Math.floor(newTotalPoints / 100) + 1;

			// Update user profile
			await db
				.update(userProfiles)
				.set({
					totalPoints: newTotalPoints,
					level: newLevel,
				})
				.where(eq(userProfiles.userId, userId));

			return { success: true, newTotalPoints, newLevel };
		}),

	// Admin procedure - list all users
	listAll: adminProcedure
		.query(async () => {
			const users = await db.query.userProfiles.findMany({
				orderBy: (userProfiles, { desc }) => [desc(userProfiles.totalPoints)],
			});

			return users;
		}),
});
