/**
 * This is your API entrypoint
 */
import { adminRouter } from "./routers/admin";
import { challengeRouter } from "./routers/challenge";
import { seasonRouter } from "./routers/season";
import { userRouter } from "./routers/user";
import { router } from "./server";

/**
 * Create the root router
 * All procedures should be added here
 */
export const appRouter = router({
	admin: adminRouter,
	challenge: challengeRouter,
	user: userRouter,
	season: seasonRouter,
});

// Export type for client usage
export type AppRouter = typeof appRouter;
