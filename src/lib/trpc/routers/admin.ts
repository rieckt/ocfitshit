import db from "@/db";
import {
    challenges,
    exerciseCatalog,
    exerciseCategories,
    exerciseCategoryLinks,
    exerciseDifficulties,
    exerciseMuscleLinks,
    levelRequirements,
    muscleGroups,
    seasons,
    teams,
    userProfiles
} from "@/db/schema";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, isNull } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure } from "../procedures";
import { router } from "../server";

export const adminRouter = router({
	// List all users - equivalent to GET /api/users
	listUsers: adminProcedure.query(async () => {
		try {
			// Use the Clerk API to fetch all users
			const clerk = await clerkClient();
			const usersResponse = await clerk.users.getUserList({
				limit: 100,
			});

			// Map the Clerk user data to a simpler format
			const users = usersResponse.data.map((user) => ({
				id: user.id,
				firstName: user.firstName || "",
				lastName: user.lastName || "",
				email: user.emailAddresses[0]?.emailAddress || "",
				username: user.username || "",
				isAdmin: user.publicMetadata?.role === "admin",
			}));

			return users;
		} catch (error) {
			console.error("Error fetching users:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch users",
			});
		}
	}),

	// Set admin role - equivalent to /api/set-admin-role
	setAdminRole: adminProcedure
		.input(
			z.object({
				username: z.string(),
				isAdmin: z.boolean(),
			}),
		)
		.mutation(async ({ input }) => {
			const { username, isAdmin } = input;

			try {
				// Update the user's metadata
				const clerk = await clerkClient();

				// First find the user by username
				const users = await clerk.users.getUserList({
					username: [username],
				});

				if (!users.data.length) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Username does not exist. Please check the username and try again.",
					});
				}

				const userId = users.data[0].id;

				// Now update the user's metadata
				await clerk.users.updateUser(userId, {
					publicMetadata: {
						role: isAdmin ? "admin" : "user",
					},
				});

				return { success: true };
			} catch (error) {
				console.error("Error setting admin role:", error);

				// If it's already a TRPCError (from our check above), re-throw it
				if (error instanceof TRPCError) {
					throw error;
				}

				// Otherwise, it's some other error from the Clerk API
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to set admin role. Please try again or contact support.",
				});
			}
		}),

	// Exercise Management
	createExercise: adminProcedure
		.input(
			z.object({
				name: z.string().min(1, "Exercise name is required"),
				description: z.string().optional(),
				equipment: z.string().optional(),
				difficultyId: z.number().int().positive(),
				categoryIds: z.array(z.number().int().positive()),
				muscleGroupIds: z.array(z.number().int().positive()),
			}),
		)
		.mutation(async ({ input }) => {
			const { name, description, equipment, difficultyId, categoryIds, muscleGroupIds } = input;

			try {
				return await db.transaction(async (tx) => {
					// Create the exercise
					const [exercise] = await tx
						.insert(exerciseCatalog)
						.values({
							name,
							description,
							equipment,
							difficultyId,
						})
						.returning();

					// Add category links
					if (categoryIds.length > 0) {
						await tx.insert(exerciseCategoryLinks).values(
							categoryIds.map((categoryId) => ({
								exerciseId: exercise.id,
								categoryId,
							})),
						);
					}

					// Add muscle group links
					if (muscleGroupIds.length > 0) {
						await tx.insert(exerciseMuscleLinks).values(
							muscleGroupIds.map((muscleGroupId) => ({
								exerciseId: exercise.id,
								muscleGroupId,
							})),
						);
					}

					return exercise;
				});
			} catch (error) {
				console.error("Error creating exercise:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create exercise",
				});
			}
		}),

	getExercises: adminProcedure.query(async () => {
		try {
			return await db.query.exerciseCatalog.findMany({
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
			});
		} catch (error) {
			console.error("Error fetching exercises:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch exercises",
			});
		}
	}),

	deleteExercise: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id } = input;

			try {
				const [deletedExercise] = await db
					.delete(exerciseCatalog)
					.where(eq(exerciseCatalog.id, id))
					.returning();

				if (!deletedExercise) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Exercise not found",
					});
				}

				return deletedExercise;
			} catch (error) {
				console.error("Error deleting exercise:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete exercise",
				});
			}
		}),

	// Exercise Categories Management
	getCategories: adminProcedure.query(async () => {
		try {
			return await db.select().from(exerciseCategories);
		} catch (error) {
			console.error("Error fetching categories:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch categories",
			});
		}
	}),

	// Exercise Difficulties Management
	getDifficulties: adminProcedure.query(async () => {
		try {
			return await db.select().from(exerciseDifficulties);
		} catch (error) {
			console.error("Error fetching difficulties:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch difficulties",
			});
		}
	}),

	// Muscle Groups Management
	getMuscleGroups: adminProcedure.query(async () => {
		try {
			return await db.select().from(muscleGroups);
		} catch (error) {
			console.error("Error fetching muscle groups:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch muscle groups",
			});
		}
	}),

	createCategory: adminProcedure
		.input(
			z.object({
				name: z.string().min(1, "Category name is required"),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const [category] = await db
					.insert(exerciseCategories)
					.values(input)
					.returning();
				return category;
			} catch (error) {
				console.error("Error creating category:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create category",
				});
			}
		}),

	createDifficulty: adminProcedure
		.input(
			z.object({
				label: z.string().min(1, "Difficulty label is required"),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const [difficulty] = await db
					.insert(exerciseDifficulties)
					.values(input)
					.returning();
				return difficulty;
			} catch (error) {
				console.error("Error creating difficulty:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create difficulty",
				});
			}
		}),

	createMuscleGroup: adminProcedure
		.input(
			z.object({
				name: z.string().min(1, "Muscle group name is required"),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const [muscleGroup] = await db
					.insert(muscleGroups)
					.values(input)
					.returning();
				return muscleGroup;
			} catch (error) {
				console.error("Error creating muscle group:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create muscle group",
				});
			}
		}),

	// Season Management
	createSeason: adminProcedure
		.input(
			z.object({
				name: z.string().min(1, "Season name is required"),
				startsAt: z.date(),
				endsAt: z.date(),
				isActive: z.boolean().default(true),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const [season] = await db
					.insert(seasons)
					.values(input)
					.returning();
				return season;
			} catch (error) {
				console.error("Error creating season:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create season",
				});
			}
		}),

	getSeasons: adminProcedure.query(async () => {
		try {
			return await db.query.seasons.findMany({
				with: {
					challenges: true,
				},
			});
		} catch (error) {
			console.error("Error fetching seasons:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch seasons",
			});
		}
	}),

	// Challenge Management
	createChallenge: adminProcedure
		.input(
			z.object({
				seasonId: z.string().uuid(),
				name: z.string().min(1, "Challenge name is required"),
				description: z.string().optional(),
				startsAt: z.date(),
				endsAt: z.date(),
				isTeamBased: z.boolean().default(false),
				pointsMultiplier: z.number().int().positive().default(1),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const [challenge] = await db
					.insert(challenges)
					.values(input)
					.returning();
				return challenge;
			} catch (error) {
				console.error("Error creating challenge:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create challenge",
				});
			}
		}),

	getChallenges: adminProcedure.query(async () => {
		try {
			return await db.query.challenges.findMany({
				with: {
					season: true,
				},
			});
		} catch (error) {
			console.error("Error fetching challenges:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch challenges",
			});
		}
	}),

	// Level Requirements Management
	createLevelRequirement: adminProcedure
		.input(
			z.object({
				level: z.number().int().positive(),
				pointsRequired: z.number().int().positive(),
				description: z.string().optional(),
				rewards: z.record(z.unknown()).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const [levelRequirement] = await db
					.insert(levelRequirements)
					.values(input)
					.returning();
				return levelRequirement;
			} catch (error) {
				console.error("Error creating level requirement:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create level requirement",
				});
			}
		}),

	getLevelRequirements: adminProcedure.query(async () => {
		try {
			return await db.select().from(levelRequirements).orderBy(levelRequirements.level);
		} catch (error) {
			console.error("Error fetching level requirements:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch level requirements",
			});
		}
	}),

	getExerciseCatalog: adminProcedure.query(async () => {
		try {
			return await db.query.exerciseCatalog.findMany({
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
			});
		} catch (error) {
			console.error("Error fetching exercise catalog:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch exercise catalog",
			});
		}
	}),

	getDashboardStats: adminProcedure.query(async () => {
		const now = new Date();
		const lastMonth = new Date();
		lastMonth.setMonth(lastMonth.getMonth() - 1);

		const [
			totalUsers,
			activeChallenges,
			exerciseCount,
			activeTeams,
			recentActivity,
			usersGrowth
		] = await Promise.all([
			// Get total users count
			db
				.select({ count: count() })
				.from(userProfiles)
				.then((result) => result[0]?.count ?? 0),

			// Get active challenges count
			db
				.select({ count: count() })
				.from(challenges)
				.where(
					and(
						gte(challenges.startsAt, now),
						isNull(challenges.endsAt)
					)
				)
				.then((result) => result[0]?.count ?? 0),

			// Get total exercises count
			db
				.select({ count: count() })
				.from(exerciseCatalog)
				.then((result) => result[0]?.count ?? 0),

			// Get active teams count
			db
				.select({ count: count() })
				.from(teams)
				.then((result) => result[0]?.count ?? 0),

			// Get recent activity (new users)
			db
				.select({
					userId: userProfiles.userId,
					displayName: userProfiles.displayName,
					avatarUrl: userProfiles.avatarUrl,
					level: userProfiles.level,
					createdAt: userProfiles.createdAt,
				})
				.from(userProfiles)
				.orderBy(desc(userProfiles.createdAt))
				.limit(5),

			// Get users growth (users joined last month)
			db
				.select({ count: count() })
				.from(userProfiles)
				.where(gte(userProfiles.createdAt, lastMonth))
				.then((result) => result[0]?.count ?? 0),
		]);

		return {
			stats: {
				totalUsers,
				activeChallenges,
				exerciseCount,
				activeTeams,
				usersGrowth,
			},
			recentActivity,
		};
	}),
});
