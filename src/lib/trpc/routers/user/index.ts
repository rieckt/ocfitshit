import { isAuthenticated } from "../../middleware/auth";
import { router } from "../../server";
import { exerciseRouter } from "./exercise";
import { profileRouter } from "./profile";

/**
 * User router
 * All routes under this router require authentication
 */
export const userRouter = router({
  profile: profileRouter,
  exercise: exerciseRouter,
})
// Apply authentication middleware to all routes
.middleware(isAuthenticated);

// Export type signature
export type UserRouter = typeof userRouter;
