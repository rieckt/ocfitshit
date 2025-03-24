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
import { DatabaseError } from "pg";
import { z } from "zod";
import { adminProcedure } from "../procedures";
import { router } from "../server";

// Improved error handling helper with specific database error codes
const handleDatabaseError = (error: unknown, operation: string) => {
	// Log the error for debugging
	console.error(`Database error during ${operation}:`, error);


	if (error instanceof DatabaseError) {
		switch (error.code) {
			case "23503": // Foreign key violation
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "This item is referenced by other records and cannot be deleted.",
					cause: error,
				});
			case "23505": // Unique violation
				throw new TRPCError({
					code: "CONFLICT",
					message: "A record with this value already exists.",
					cause: error,
				});
			case "23514": // Check violation
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The provided data violates a constraint.",
					cause: error,
				});
			case "42P01": // Undefined table
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Database schema error.",
					cause: error,
				});
			default:
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "An unexpected database error occurred.",
					cause: error,
				});
		}
	}

	// Handle drizzle-specific errors
	if (error instanceof Error && error.name === "DrizzleError") {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Database operation failed.",
			cause: error,
		});
	}

	// Handle other types of errors
	if (error instanceof Error) {
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: error.message,
			cause: error,
		});
	}

	// Handle unknown errors
	throw new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: "An unexpected error occurred.",
		cause: error,
	});
};

// Add type-safe error handling helper for common operations
const handleOperationError = async <T>(
	operation: () => Promise<T>,
	context: { operation: string; notFoundMessage?: string }
): Promise<T> => {
	try {
		const result = await operation();

		// Handle null results for operations that should return data
		if (result === null || (Array.isArray(result) && result.length === 0)) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: context.notFoundMessage || "Resource not found",
			});
		}

		return result;
	} catch (error) {
		handleDatabaseError(error, context.operation);
		throw error; // This line won't be reached but satisfies TypeScript
	}
};

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
				description: z.string().min(1, "Description is required"),
				equipment: z.string().min(1, "Equipment information is required"),
				difficultyId: z.number().int().positive("Difficulty level is required"),
				categoryIds: z.array(z.number().int().positive()).min(1, "At least one category is required"),
				muscleGroupIds: z.array(z.number().int().positive()).min(1, "At least one muscle group is required"),
			}),
		)
		.mutation(async ({ input }) => {
			const { name, description, equipment, difficultyId, categoryIds, muscleGroupIds } = input;

			try {
				// Create the exercise first
				const [exercise] = await db
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
					await db.insert(exerciseCategoryLinks).values(
						categoryIds.map((categoryId) => ({
							exerciseId: exercise.id,
							categoryId,
						})),
					);
				}

				// Add muscle group links
				if (muscleGroupIds.length > 0) {
					await db.insert(exerciseMuscleLinks).values(
						muscleGroupIds.map((muscleGroupId) => ({
							exerciseId: exercise.id,
							muscleGroupId,
						})),
					);
				}

				// Return the created exercise with its relationships
				const exerciseWithRelations = await db.query.exerciseCatalog.findFirst({
					where: eq(exerciseCatalog.id, exercise.id),
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

				if (!exerciseWithRelations) {
					throw new Error("Failed to fetch created exercise");
				}

				return exerciseWithRelations;
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
			return handleOperationError(
				async () => {
					// Check for existing exercise logs
					const exerciseInUse = await db.query.exerciseLogs.findFirst({
						where: (logs, { eq }) => eq(logs.exerciseId, input.id)
					});

					if (exerciseInUse) {
						throw new TRPCError({
							code: "PRECONDITION_FAILED",
							message: "This exercise cannot be deleted because it has been used in workout logs.",
						});
					}

					const [deletedExercise] = await db
						.delete(exerciseCatalog)
						.where(eq(exerciseCatalog.id, input.id))
						.returning();

					if (!deletedExercise) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Exercise not found",
						});
					}

					return deletedExercise;
				},
				{ operation: "deleteExercise", notFoundMessage: "Exercise not found" }
			);
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

	// Add delete procedures for difficulties, categories, and muscle groups
	deleteDifficulty: adminProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id } = input;

			try {
				// First check if the difficulty is being used by any exercises
				const exercisesUsingDifficulty = await db
					.select({ count: count() })
					.from(exerciseCatalog)
					.where(eq(exerciseCatalog.difficultyId, id));

				if (exercisesUsingDifficulty[0]?.count > 0) {
					throw new TRPCError({
						code: "PRECONDITION_FAILED",
						message: "This difficulty level cannot be deleted because it is being used by existing exercises.",
					});
				}

				const [deletedDifficulty] = await db
					.delete(exerciseDifficulties)
					.where(eq(exerciseDifficulties.id, id))
					.returning();

				if (!deletedDifficulty) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Difficulty level not found",
					});
				}

				return deletedDifficulty;
			} catch (error) {
				handleDatabaseError(error, "deleting difficulty");
			}
		}),

	deleteCategory: adminProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id } = input;

			try {
				// First check if the category is being used by any exercises
				const exercisesUsingCategory = await db
					.select({ count: count() })
					.from(exerciseCategoryLinks)
					.where(eq(exerciseCategoryLinks.categoryId, id));

				if (exercisesUsingCategory[0]?.count > 0) {
					throw new TRPCError({
						code: "PRECONDITION_FAILED",
						message: "This category cannot be deleted because it is being used by existing exercises.",
					});
				}

				const [deletedCategory] = await db
					.delete(exerciseCategories)
					.where(eq(exerciseCategories.id, id))
					.returning();

				if (!deletedCategory) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Category not found",
					});
				}

				return deletedCategory;
			} catch (error) {
				handleDatabaseError(error, "deleting category");
			}
		}),

	deleteMuscleGroup: adminProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id } = input;

			try {
				// First check if the muscle group is being used by any exercises
				const exercisesUsingMuscleGroup = await db
					.select({ count: count() })
					.from(exerciseMuscleLinks)
					.where(eq(exerciseMuscleLinks.muscleGroupId, id));

				if (exercisesUsingMuscleGroup[0]?.count > 0) {
					throw new TRPCError({
						code: "PRECONDITION_FAILED",
						message: "This muscle group cannot be deleted because it is being used by existing exercises.",
					});
				}

				const [deletedMuscleGroup] = await db
					.delete(muscleGroups)
					.where(eq(muscleGroups.id, id))
					.returning();

				if (!deletedMuscleGroup) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Muscle group not found",
					});
				}

				return deletedMuscleGroup;
			} catch (error) {
				handleDatabaseError(error, "deleting muscle group");
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
