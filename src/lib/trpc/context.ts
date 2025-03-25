import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

// Pre-compute role values for better type inference
const ROLES = {
	ADMIN: "admin",
} as const;

/**
 * Context for tRPC procedures
 * Contains information about the user making the request
 */
export type Context = {
	/**
	 * The authenticated user's ID, or null if not authenticated
	 */
	userId: string | null;

	/**
	 * Whether the current user has admin privileges
	 */
	isAdmin: boolean;

	/**
	 * Brand for better type caching
	 */
	__brand?: "TRPCContext";
};

// Pre-compute default context for better performance
const DEFAULT_CONTEXT: Context = {
	userId: null,
	isAdmin: false,
} as const;

/**
 * Cached function to get the current user.
 * Using React's cache() for request-level memoization in Next.js 15+
 */
const getUser = cache(async () => {
	return await currentUser();
});

/**
 * Creates the tRPC context for each request
 * This function runs on every request and provides auth data to procedures
 *
 * @returns The context object with auth information
 */
export const createContext = async (): Promise<Context> => {
	// Get auth session - fast, doesn't make API calls
	const { userId } = await auth();

	// Short-circuit for unauthenticated users
	if (!userId) {
		return DEFAULT_CONTEXT;
	}

	// For authenticated users, check admin status
	// Since we're using cache(), this won't make redundant API calls
	// within the same request context
	const user = await getUser();
	const isAdmin = user?.publicMetadata?.role === ROLES.ADMIN;

	return {
		userId,
		isAdmin: Boolean(isAdmin),
	};
};

// Export helper types for better DX
export type ContextUser = NonNullable<Awaited<ReturnType<typeof getUser>>>;
export type AuthenticatedContext = Context & { userId: string };
