import db from "@/db";
import {
    exerciseCatalog,
    exerciseLogs,
    levelRequirements,
    teamMembers,
    teams,
    userProfiles
} from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure } from "../procedures";
import { router } from "../server";

// Fix the exerciseLogs type error in getExerciseHistory
type ExerciseLog = typeof exerciseLogs.$inferSelect;

export const userRouter = router({
	// Public procedure - get user by ID with stats
	getById: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ input }) => {
			const { userId } = input;

			const user = await db.query.userProfiles.findFirst({
				where: eq(userProfiles.userId, userId),
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

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			return user;
		}),

	// Protected procedure - get current user profile with full details
	getProfile: protectedProcedure.query(async ({ ctx }) => {
		const { userId } = ctx;

		const profile = await db.query.userProfiles.findFirst({
			where: eq(userProfiles.userId, userId),
			with: {
				level: true,
				badges: true,
				teamMembers: {
					with: {
						team: true,
					},
				},
				exerciseLogs: {
					orderBy: (exerciseLogs, { desc }) => [desc(exerciseLogs.createdAt)],
					limit: 10,
					with: {
						exercise: {
							with: {
								difficulty: true,
								categories: {
									with: {
										category: true,
									},
								},
								muscleGroups: {
									with: {
										muscleGroup: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!profile) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "User profile not found",
			});
		}

		return profile;
	}),

	// Protected procedure - log exercise and update points
	logExercise: protectedProcedure
		.input(
			z.object({
				exerciseId: z.string().uuid(),
				challengeId: z.string().uuid().optional(),
				quantity: z.number().optional(),
				unit: z.string().optional(),
				sets: z.number().optional(),
				weight: z.number().optional(),
				duration: z.number().optional(),
				calories: z.number().optional(),
				metadata: z.record(z.unknown()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { userId } = ctx;
			const {
				exerciseId,
				challengeId,
				quantity,
				unit,
				sets,
				weight,
				duration,
				calories,
				metadata,
			} = input;

			return await db.transaction(async (tx) => {
				// Get exercise details for difficulty multiplier
				const exercise = await tx.query.exerciseCatalog.findFirst({
					where: eq(exerciseCatalog.id, exerciseId),
					with: {
						difficulty: true,
					},
				});

				if (!exercise) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Exercise not found",
					});
				}

				// Calculate points based on exercise difficulty and other factors
				const difficultyMultiplier = exercise.difficulty?.id || 1;
				const basePoints = 10; // Base points per exercise
				const points = basePoints * difficultyMultiplier;

				// Log the exercise
				const [exerciseLog] = await tx
					.insert(exerciseLogs)
					.values({
						userId,
						exerciseId,
						challengeId,
						quantity,
						unit,
						sets,
						weight,
						duration,
						calories,
						difficultyMultiplier,
						points,
						metadata,
					})
					.returning();

				// Update user points and check for level up
				const currentProfile = await tx.query.userProfiles.findFirst({
					where: eq(userProfiles.userId, userId),
				});

				if (!currentProfile) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User profile not found",
					});
				}

				const newTotalPoints = currentProfile.totalPoints + points;
				const newCurrentPoints = currentProfile.currentPoints + points;

				// Get next level requirements
				const nextLevel = await tx.query.levelRequirements.findFirst({
					where: eq(levelRequirements.level, currentProfile.level + 1),
				});

				// Check if user leveled up
				const leveledUp = nextLevel && newTotalPoints >= nextLevel.pointsRequired;
				const newLevel = leveledUp ? currentProfile.level + 1 : currentProfile.level;

				// Update user profile
				const [updatedProfile] = await tx
					.update(userProfiles)
					.set({
						totalPoints: newTotalPoints,
						currentPoints: newCurrentPoints,
						level: newLevel,
					})
					.where(eq(userProfiles.userId, userId))
					.returning();

				// If user is in a team, update team points
				const userTeam = await tx.query.teamMembers.findFirst({
					where: eq(teamMembers.userId, userId),
					with: {
						team: true,
					},
				});

				if (userTeam) {
					await tx
						.update(teams)
						.set({
							totalTeamPoints: userTeam.team.totalTeamPoints + points,
						})
						.where(eq(teams.id, userTeam.team.id));

					await tx
						.update(userProfiles)
						.set({
							teamPoints: currentProfile.teamPoints + points,
						})
						.where(eq(userProfiles.userId, userId));
				}

				return {
					exerciseLog,
					profile: updatedProfile,
					leveledUp,
					pointsEarned: points,
				};
			});
		}),

	// Protected procedure - get user's exercise history
	getExerciseHistory: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(10),
				cursor: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { userId } = ctx;
			const { limit, cursor } = input;

			const logs = await db.query.exerciseLogs.findMany({
				where: eq(exerciseLogs.userId, userId),
				limit: limit + 1,
				offset: cursor,
				orderBy: (logs, { desc }) => [desc(logs.createdAt)],
				with: {
					exercise: {
						with: {
							difficulty: true,
							categories: {
								with: {
									category: true,
								},
							},
							muscleGroups: {
								with: {
									muscleGroup: true,
								},
							},
						},
					},
					challenge: true,
				},
			});

			let nextCursor: typeof cursor | undefined = undefined;
			if (logs.length > limit) {
				const nextItem = logs.pop();
				nextCursor = cursor ? cursor + limit : limit;
			}

			return {
				items: logs,
				nextCursor,
			};
		}),

	// Admin procedure - list all users with stats
	listAll: adminProcedure.query(async () => {
		const users = await db.query.userProfiles.findMany({
			orderBy: (userProfiles, { desc }) => [desc(userProfiles.totalPoints)],
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

		return users;
	}),
});
