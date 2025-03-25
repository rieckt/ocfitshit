import { TRPCError } from "@trpc/server";
import { middleware } from "../server";

interface LogEntry {
  timestamp: string;
  userId: string | null;
  path: string;
  type: string;
  durationMs?: number;
  status: "success" | "error";
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Authentication middleware
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
 * Admin middleware
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
 * Permission middleware
 */
export const hasPermission = (permission: string) =>
  middleware(async ({ ctx, next }) => {
    // Implement your permission check logic here
    // const userPermissions = await db.query.permissions...
    return next();
  });

/**
 * Logging middleware
 */
export const loggerMiddleware = middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const log: LogEntry = {
    timestamp: new Date().toISOString(),
    userId: ctx.userId,
    path,
    type,
    status: "success",
  };

  try {
    const result = await next();
    log.durationMs = Date.now() - start;
    console.log(JSON.stringify(log));
    return result;
  } catch (err) {
    log.status = "error";
    log.durationMs = Date.now() - start;

    if (err instanceof TRPCError) {
      log.error = {
        code: err.code,
        message: err.message,
      };
    } else if (err instanceof Error) {
      log.error = {
        code: "INTERNAL_SERVER_ERROR",
        message: err.message,
      };
    } else {
      log.error = {
        code: "UNKNOWN",
        message: "An unknown error occurred",
      };
    }

    console.error(JSON.stringify(log));
    throw err;
  }
});

// Error handling middleware
export const errorMiddleware = middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    // Add timestamp and request ID to errors
    if (error instanceof TRPCError) {
      throw new TRPCError({
        code: error.code,
        message: error.message,
        cause: {
          ...error.cause,
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      });
    }
    throw error;
  }
});

// Validation middleware
export const validationMiddleware = middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Validation failed",
        cause: {
          originalError: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
    throw error;
  }
});

