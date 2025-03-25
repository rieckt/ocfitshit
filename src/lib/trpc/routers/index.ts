import { router } from "../server";
import { adminRouter } from "./admin";
import { challengeRouter } from "./challenge";
import { seasonRouter } from "./season";
import { userRouter } from "./user";

export const appRouter = router({
  user: userRouter,
  admin: adminRouter,
  challenge: challengeRouter,
  season: seasonRouter,
});

// Export type router type signature
export type AppRouter = typeof appRouter;

