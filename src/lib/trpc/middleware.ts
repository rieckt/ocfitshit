import { TRPCError } from "@trpc/server";
import { middleware } from "./server";

/**
 * Middleware to ensure a user is authenticated
 */
export const isAuthenticated = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

/**
 * Middleware to ensure a user is an admin
 */
export const isAdmin = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  if (!ctx.isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this resource",
    });
  }

  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});
