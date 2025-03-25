import { router } from "../server";
import { adminRouter } from "./admin";
import { publicRouter } from "./public";
import { userRouter } from "./user";

/**
 * Main application router
 * This is the main router that combines all sub-routers
 */
export const appRouter = router({
  // Public routes (no auth required)
  public: publicRouter,

  // User routes (auth required)
  user: userRouter,

  // Admin routes (admin auth required)
  admin: adminRouter,
});

// Export type signature
export type AppRouter = typeof appRouter;
