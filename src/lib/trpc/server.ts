import type { inferAsyncReturnType } from "@trpc/server";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { type Context, createContext } from "./context";

// Initialize tRPC with lazy type evaluation
const t = initTRPC
	.context<Context>()
	.create({
		transformer: superjson,
		// Enable error formatting in development
		errorFormatter: ({ shape, error }) => ({
			...shape,
			data: {
				...shape.data,
				stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
			},
		}),
	});

// Export reusable router and procedure builders
export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

// Re-export context with better type inference
export { createContext };
export type { Context };

// Export helper types for better DX
export type RouterContext = inferAsyncReturnType<typeof createContext>;
export type Middleware = typeof middleware;
export type Procedure = typeof publicProcedure;

