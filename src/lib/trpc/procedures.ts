import { isAdmin, isAuthenticated } from "./middleware";
import { publicProcedure as serverPublicProcedure } from "./server";

/**
 * Public procedure - can be called by anyone
 */
export const publicProcedure = serverPublicProcedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = serverPublicProcedure.use(isAuthenticated);

/**
 * Admin procedure - requires admin privileges
 */
export const adminProcedure = serverPublicProcedure.use(isAdmin);
