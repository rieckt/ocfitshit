import { TRPCError } from "@trpc/server";
import { middleware } from "./server";

// Pre-compute error messages for better performance
const ERRORS = {
  UNAUTHORIZED: {
    code: "UNAUTHORIZED" as const,
    message: "You must be logged in to access this resource",
  },
  FORBIDDEN: {
    code: "FORBIDDEN" as const,
    message: "You do not have permission to access this resource",
  },
} as const;

/**
 * Middleware to ensure a user is authenticated
 * Uses lazy type evaluation and pre-computed error messages
 */
export const isAuthenticated = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError(ERRORS.UNAUTHORIZED);
  }

  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

/**
 * Middleware to ensure a user is an admin
 * Uses lazy type evaluation and pre-computed error messages
 */
export const isAdmin = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError(ERRORS.UNAUTHORIZED);
  }

  if (!ctx.isAdmin) {
    throw new TRPCError(ERRORS.FORBIDDEN);
  }

  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

// Export middleware types for better DX
export type AuthMiddleware = typeof isAuthenticated;
export type AdminMiddleware = typeof isAdmin;
