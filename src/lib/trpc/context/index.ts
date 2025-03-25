import { getAuth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";

/**
 * tRPC Context type definition with Clerk Auth
 */
export interface Context {
  auth: {
    userId: string | null;
    sessionId: string | null;
    isAdmin: boolean;
  };
}

/**
 * Creates context for an incoming request
 */
export async function createContext({ req }: CreateNextContextOptions): Promise<Context> {
  const auth = getAuth(req);
  const metadata = auth.sessionClaims?.metadata as { role?: string } | undefined;

  return {
    auth: {
      userId: auth.userId,
      sessionId: auth.sessionId,
      isAdmin: metadata?.role === "admin" || false,
    },
  };
}

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    };
  },
});

/**
 * Auth middleware - ensures user is authenticated
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }
  return next({
    ctx: {
      auth: {
        ...ctx.auth,
        userId: ctx.auth.userId,
      },
    },
  });
});

/**
 * Admin middleware - ensures user is an admin
 */
const enforceAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.auth.isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin to perform this action",
    });
  }
  return next();
});

// Export router and procedures
export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceAuth);
export const adminProcedure = protectedProcedure.use(enforceAdmin);
