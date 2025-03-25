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
    teams
} from "@/db/schema";
import type { User } from "@clerk/nextjs/server";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { and, count, eq, gte } from "drizzle-orm";
import { DatabaseError } from "pg";
import { z } from "zod";
import { adminProcedure, publicProcedure } from "../procedures";
import { router } from "../server";

// Improved input validation schemas
const exerciseInput = z.object({
	name: z.string().min(1, "Exercise name is required"),
	description: z.string().min(1, "Description is required"),
	equipment: z.string().min(1, "Equipment information is required"),
	difficultyId: z.number().int().positive("Difficulty level is required"),
	categoryIds: z.array(z.number().int().positive()).min(1, "At least one category is required"),
	muscleGroupIds: z.array(z.number().int().positive()).min(1, "At least one muscle group is required"),
});

const seasonInput = z.object({
	name: z.string().min(1, "Season name is required"),
	startsAt: z.date(),
	endsAt: z.date(),
	isActive: z.boolean().default(true),
}).refine(data => data.startsAt < data.endsAt, {
	message: "Start date must be before end date",
	path: ["startsAt"],
});

const challengeInput = z.object({
	seasonId: z.string().uuid(),
	name: z.string().min(1, "Challenge name is required"),
	description: z.string().optional(),
	startsAt: z.date(),
	endsAt: z.date(),
	isTeamBased: z.boolean().default(false),
	pointsMultiplier: z.number().int().positive().default(1),
}).refine(data => data.startsAt < data.endsAt, {
	message: "Start date must be before end date",
	path: ["startsAt"],
});

// Improved error handling helper
const handleDatabaseError = (error: unknown, operation: string) => {
	console.error(`Database error during ${operation}:`, error);

	if (error instanceof DatabaseError) {
		const errorMap: Record<string, TRPCError> = {
			"23503": new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "This item is referenced by other records and cannot be deleted.",
			}),
			"23505": new TRPCError({
				code: "CONFLICT",
				message: "A record with this value already exists.",
			}),
			"23514": new TRPCError({
				code: "BAD_REQUEST",
				message: "The provided data violates a constraint.",
			}),
		};

		if (error.code && error.code in errorMap) {
			return errorMap[error.code as keyof typeof errorMap];
		}
	}

	throw new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: "An unexpected error occurred.",
	});
};

// Type-safe operation wrapper
const safeOperation = async <T>(
	operation: () => Promise<T>,
	context: { operation: string; notFoundMessage?: string }
): Promise<T> => {
	try {
		const result = await operation();
		if (result === null || (Array.isArray(result) && result.length === 0)) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: context.notFoundMessage || "Resource not found",
			});
		}
		return result;
	} catch (error) {
		handleDatabaseError(error, context.operation);
		throw error;
	}
};

export const adminRouter = router({
	// User Management
	checkIsAdmin: publicProcedure.query(async ({ ctx }) => {
		const { userId } = ctx;
		if (!userId) return false;

		return safeOperation(
			async () => {
				const user = await currentUser();
				return user?.publicMetadata?.role === "admin" || false;
			},
			{ operation: "checkIsAdmin" }
		);
	}),

	listUsers: adminProcedure.query(async () => {
		return safeOperation(
			async () => {
				const userList = await clerkClient().then(client => client.users.getUserList({ limit: 100 }));
				return userList.data.map((user: User) => ({
					id: user.id,
					firstName: user.firstName || "",
					lastName: user.lastName || "",
					email: user.emailAddresses[0]?.emailAddress || "",
					username: user.username || "",
					isAdmin: user.publicMetadata?.role === "admin",
					avatarUrl: user.imageUrl,
				}));
			},
			{ operation: "listUsers" }
		);
	}),

	setAdminRole: adminProcedure
		.input(z.object({
			username: z.string(),
			isAdmin: z.boolean(),
		}))
		.mutation(async ({ input }) => {
			return safeOperation(
				async () => {
					const users = await clerkClient().then(client => client.users.getUserList({
						username: [input.username],
					}));

					if (!users.data.length) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Username not found",
						});
					}

					await clerkClient().then(client => client.users.updateUser(users.data[0].id, {
						publicMetadata: { role: input.isAdmin ? "admin" : "user" },
					}));

					return { success: true };
				},
				{ operation: "setAdminRole" }
			);
		}),

	// Exercise Management
	createExercise: adminProcedure
		.input(exerciseInput)
		.mutation(async ({ input }) => {
			return db.transaction(async (tx) => {
				const [exercise] = await tx
					.insert(exerciseCatalog)
					.values({
						name: input.name,
						description: input.description,
						equipment: input.equipment,
						difficultyId: input.difficultyId,
					})
					.returning();

				await tx.insert(exerciseCategoryLinks).values(
					input.categoryIds.map(categoryId => ({
						exerciseId: exercise.id,
						categoryId,
					}))
				);

				await tx.insert(exerciseMuscleLinks).values(
					input.muscleGroupIds.map(muscleGroupId => ({
						exerciseId: exercise.id,
						muscleGroupId,
					}))
				);

				return tx.query.exerciseCatalog.findFirst({
					where: eq(exerciseCatalog.id, exercise.id),
					with: {
						difficulty: true,
						categories: { with: { category: true } },
						muscleGroups: { with: { muscleGroup: true } },
					},
				});
			});
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
			return safeOperation(
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
		.input(seasonInput)
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
		.input(challengeInput)
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

	// Dashboard Stats
	getDashboardStats: adminProcedure.query(async () => {
		return safeOperation(
			async () => {
				const [
					usersResponse,
					{ activeChallenges },
					{ exerciseCount },
					{ activeTeams },
				] = await Promise.all([
					clerkClient().then(client => client.users.getUserList({ limit: 100 })),
					db
						.select({ activeChallenges: count(challenges.id) })
						.from(challenges)
						.where(and(gte(challenges.endsAt, new Date()), eq(challenges.isTeamBased, true)))
						.then(rows => rows[0]),
					db
						.select({ exerciseCount: count(exerciseCatalog.id) })
						.from(exerciseCatalog)
						.then(rows => rows[0]),
					db
						.select({ activeTeams: count(teams.id) })
						.from(teams)
						.then(rows => rows[0]),
				]);

				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

				return {
					stats: {
						totalUsers: usersResponse.totalCount,
						activeChallenges,
						exerciseCount,
						activeTeams,
						usersGrowth: usersResponse.data.filter(
							(user: User) => new Date(user.createdAt) >= thirtyDaysAgo
						).length,
					},
					recentActivity: usersResponse.data
						.sort((a: User, b: User) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
						.slice(0, 10)
						.map((user: User) => ({
							userId: user.id,
							displayName: user.firstName && user.lastName
								? `${user.firstName} ${user.lastName}`
								: user.username || "Anonymous User",
							avatarUrl: user.imageUrl,
							level: 1,
							createdAt: new Date(user.createdAt),
						})),
				};
			},
			{ operation: "getDashboardStats" }
		);
	}),
});
