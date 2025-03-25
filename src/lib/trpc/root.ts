/**
 * This is your API entrypoint
 */
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { adminRouter } from "./routers/admin";
import { challengeRouter } from "./routers/challenge";
import { seasonRouter } from "./routers/season";
import { userRouter } from "./routers/user";
import { router } from "./server";

// Pre-compute router configuration for better type performance
const routerConfig = {
	admin: adminRouter,
	challenge: challengeRouter,
	user: userRouter,
	season: seasonRouter,
} as const;

/**
 * Create the root router
 * All procedures should be added here
 */
export const appRouter = router(routerConfig);

// Export type router for client usage
export type AppRouter = typeof appRouter;

// Export input/output types for better DX and type performance
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Export individual router types for better code splitting
export type AdminRouter = (typeof routerConfig)["admin"];
export type ChallengeRouter = (typeof routerConfig)["challenge"];
export type UserRouter = (typeof routerConfig)["user"];
export type SeasonRouter = (typeof routerConfig)["season"];
