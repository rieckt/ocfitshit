import { TRPCError } from "@trpc/server";
import { middleware } from "../server";

/**
 * Middleware to ensure user is authenticated
 */
export const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }
  return next();
});

/**
 * Middleware to ensure user is an admin
 */
export const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin to perform this action",
    });
  }
  return next();
});

/**
 * Middleware to ensure user has required permissions
 */
export const hasPermission = (permission: string) =>
  middleware(async ({ ctx, next }) => {
    // Implement your permission check logic here
    // const userPermissions = await db.query.permissions...
    return next();
  });
