import type { AnyProcedure, inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { isAdmin, isAuthenticated } from "./middleware";
import { publicProcedure as serverPublicProcedure } from "./server";

/**
 * Public procedure - can be called by anyone
 * Uses lazy type evaluation for better performance
 */
export const publicProcedure = serverPublicProcedure;

/**
 * Protected procedure - requires authentication
 * Uses lazy type evaluation for better performance
 */
export const protectedProcedure = serverPublicProcedure.use(isAuthenticated);

/**
 * Admin procedure - requires admin privileges
 * Uses lazy type evaluation for better performance
 */
export const adminProcedure = serverPublicProcedure.use(isAdmin);

// Export helper types for better DX
export type PublicProcedure = typeof publicProcedure;
export type ProtectedProcedure = typeof protectedProcedure;
export type AdminProcedure = typeof adminProcedure;

// Helper type to infer procedure input/output
export type InferProcedureInput<T extends AnyProcedure> = inferProcedureInput<T>;
export type InferProcedureOutput<T extends AnyProcedure> = inferProcedureOutput<T>;
