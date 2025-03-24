import db from "@/db";
import { exerciseTypes, exercises } from "@/db/schema";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
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

	createExerciseType: adminProcedure
		.input(
			z.object({
				name: z.string().min(1, "Exercise name is required"),
				unit: z.string().min(1, "Unit is required"),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const { name, unit } = input;

				// Insert the new exercise type
				const [newExerciseType] = await db
					.insert(exerciseTypes)
					.values({
						name,
						unit,
					})
					.returning();

				return newExerciseType;
			} catch (error) {
				console.error("Error creating exercise type:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create exercise type",
				});
			}
		}),

	// Get all exercise types
	getExerciseTypes: adminProcedure.query(async () => {
		try {
			const types = await db.select().from(exerciseTypes);
			return types;
		} catch (error) {
			console.error("Error fetching exercise types:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch exercise types",
			});
		}
	}),

	deleteExerciseType: adminProcedure
		.input(
			z.object({
				id: z.number({
					required_error: "Exercise type ID is required",
					invalid_type_error: "Exercise type ID must be a number",
				}),
			}),
		)
		.mutation(async ({ input }) => {
			const { id } = input;

			try {
				// First check if the exercise type exists
				const existingType = await db.query.exerciseTypes.findFirst({
					where: eq(exerciseTypes.id, id),
				});

				if (!existingType) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Exercise type not found",
					});
				}

				// Delete all exercises of this type first
				await db.delete(exercises)
					.where(eq(exercises.exerciseTypeId, id));

				// Then delete the exercise type
				const [deletedType] = await db.delete(exerciseTypes)
					.where(eq(exerciseTypes.id, id))
					.returning();

				if (!deletedType) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to delete exercise type",
					});
				}

				return deletedType;
			} catch (error) {
				// If it's already a TRPCError, rethrow it
				if (error instanceof TRPCError) {
					throw error;
				}

				// Log the actual error for debugging
				console.error("Error deleting exercise type:", error);

				// Return a safe error message to the client
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete exercise type. Please try again later.",
				});
			}
		}),
});
