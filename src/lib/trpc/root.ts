/**
 * This is your API entrypoint
 */
import { router } from "./server";

/**
 * Import routers from index file
 */
import { adminRouter, challengeRouter, userRouter } from "./routers";

/**
 * Create the root router
 * All procedures should be added here
 */
export const appRouter = router({
	user: userRouter,
	challenge: challengeRouter,
	admin: adminRouter,
});

// Export type for client usage
export type AppRouter = typeof appRouter;
