import db from "@/db";
import {
    exerciseCatalog,
    exerciseLogs,
    levelRequirements,
    userProfiles
} from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { loggerMiddleware } from "../middleware/index";
import { adminProcedure, protectedProcedure, publicProcedure } from "../procedures";
import { router } from "../server";
import {
    metadataSchema,
    paginationSchema,
    positiveNumber,
    uuidString,
} from "../transformers/input";

// Input schemas with transformers - using lazy evaluation for complex types
const userIdSchema = z.object({
	userId: z.string()
}).brand<'UserId'>();

// Using lazy evaluation for complex nested schema
const logExerciseSchema = z.lazy(() => z.object({
	exerciseId: uuidString,
	challengeId: uuidString.optional(),
	quantity: positiveNumber.optional(),
	unit: z.string().min(1).optional(),
	sets: positiveNumber.optional(),
	weight: positiveNumber.optional(),
	duration: positiveNumber.optional(),
	calories: positiveNumber.optional(),
	metadata: metadataSchema.optional(),
}));

// Output schemas - simplified and using lazy evaluation
const exerciseLogSchema = z.lazy(() => z.object({
	id: z.string(),
	userId: z.string(),
	exerciseId: z.string(),
	points: z.number(),
	createdAt: z.date(),
}));

// Pre-compute common query includes for better performance
const profileIncludes = {
	level: true,
	badges: true,
	teamMembers: {
		with: {
			team: true,
		},
	},
} as const;

const exerciseIncludes = {
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
} as const;

// Sub-routers with optimized type handling
const profileRouter = router({
	get: protectedProcedure
		.use(loggerMiddleware)
		.query(async ({ ctx }) => {
			const profile = await db.query.userProfiles.findFirst({
				where: eq(userProfiles.userId, ctx.userId),
				with: {
					...profileIncludes,
					exerciseLogs: {
						orderBy: (exerciseLogs, { desc }) => [desc(exerciseLogs.createdAt)],
						limit: 10,
						with: {
							exercise: {
								with: exerciseIncludes,
							},
						},
					},
				},
			});

			if (!profile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User profile not found",
					cause: { userId: ctx.userId },
				});
			}

			return profile;
		}),

	getById: publicProcedure
		.input(userIdSchema)
		.use(loggerMiddleware)
		.query(async ({ input }) => {
			const user = await db.query.userProfiles.findFirst({
				where: eq(userProfiles.userId, input.userId),
				with: profileIncludes,
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
					cause: { userId: input.userId },
				});
			}

			return user;
		}),
});

const exerciseRouter = router({
	log: protectedProcedure
		.input(logExerciseSchema)
		.output(exerciseLogSchema)
		.use(loggerMiddleware)
		.mutation(async ({ ctx, input }) => {
			return await db.transaction(async (tx) => {
				const exercise = await tx.query.exerciseCatalog.findFirst({
					where: eq(exerciseCatalog.id, input.exerciseId),
					with: {
						difficulty: true,
					},
				});

				if (!exercise) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Exercise not found",
						cause: { exerciseId: input.exerciseId },
					});
				}

				const difficultyMultiplier = exercise.difficulty?.id || 1;
				const basePoints = 10;
				const points = basePoints * difficultyMultiplier;

				const [exerciseLog] = await tx
					.insert(exerciseLogs)
					.values({
						userId: ctx.userId,
						exerciseId: input.exerciseId,
						challengeId: input.challengeId ?? null,
						quantity: input.quantity ?? null,
						unit: input.unit ?? null,
						sets: input.sets ?? null,
						weight: input.weight ?? null,
						duration: input.duration ?? null,
						calories: input.calories ?? null,
						difficultyMultiplier,
						points,
						metadata: input.metadata ?? null,
					})
					.returning();

				await updateUserPoints(tx, ctx.userId, points);

				return {
					id: exerciseLog.id,
					userId: exerciseLog.userId,
					exerciseId: exerciseLog.exerciseId,
					points: exerciseLog.points,
					createdAt: exerciseLog.createdAt ?? new Date(),
				};
			});
		}),

	history: protectedProcedure
		.input(paginationSchema)
		.use(loggerMiddleware)
		.query(async ({ ctx, input }) => {
			const { limit, cursor } = input;

			const logs = await db.query.exerciseLogs.findMany({
				where: eq(exerciseLogs.userId, ctx.userId),
				limit: limit + 1,
				offset: cursor,
				orderBy: (logs, { desc }) => [desc(logs.createdAt)],
				with: {
					exercise: {
						with: exerciseIncludes,
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
});

const adminRouter = router({
	listAll: adminProcedure
		.use(loggerMiddleware)
		.query(async () => {
			return await db.query.userProfiles.findMany({
				orderBy: (userProfiles, { desc }) => [desc(userProfiles.totalPoints)],
				with: profileIncludes,
			});
		}),
});

// Helper function for updating user points - optimized with type assertions
async function updateUserPoints(tx: any, userId: string, points: number) {
	const currentProfile = await tx.query.userProfiles.findFirst({
		where: eq(userProfiles.userId, userId),
		columns: {
			totalPoints: true,
			currentPoints: true,
			level: true,
		},
	});

	if (!currentProfile) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "User profile not found",
			cause: { userId },
		});
	}

	const newTotalPoints = currentProfile.totalPoints + points;
	const newCurrentPoints = currentProfile.currentPoints + points;

	const nextLevel = await tx.query.levelRequirements.findFirst({
		where: eq(levelRequirements.level, currentProfile.level + 1),
		columns: {
			pointsRequired: true,
		},
	});

	const leveledUp = nextLevel && newTotalPoints >= nextLevel.pointsRequired;
	const newLevel = leveledUp ? currentProfile.level + 1 : currentProfile.level;

	await tx
		.update(userProfiles)
		.set({
			totalPoints: newTotalPoints,
			currentPoints: newCurrentPoints,
			level: newLevel,
		})
		.where(eq(userProfiles.userId, userId));
}

// Main router with sub-routers
export const userRouter = router({
	profile: profileRouter,
	exercise: exerciseRouter,
	admin: adminRouter,
});

// Type export with lazy evaluation
export type UserRouter = typeof userRouter;
