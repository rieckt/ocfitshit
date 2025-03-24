import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { type Context, createContext } from "./context";

// Initialize tRPC
const t = initTRPC.context<Context>().create({
	transformer: superjson,
});

// Export reusable router and procedure builders
export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

// Re-export context
export { createContext };
export type { Context };

