import { appRouter } from "@/lib/trpc/root";
import { createContext } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = async (req: Request, context: { params: { trpc: string } }) => {
	// Process request with enhanced error handling
	try {
		return await fetchRequestHandler({
			endpoint: "/api/trpc",
			req,
			router: appRouter,
			createContext,
			onError:
				process.env.NODE_ENV === "development"
					? ({ path, error }: { path?: string; error: TRPCError }) => {
							console.error(
								`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
								{
									error,
									code: error.code,
									data: error.data,
									path,
									type: error.name,
									cause: error.cause,
								}
							);
					  }
					: ({ path, error }: { path?: string; error: TRPCError }) => {
							console.error(`tRPC error on ${path ?? "<no-path>"}`, {
								code: error.code,
								message: error.message,
								type: error.name,
								path,
							});
					  },
		});
	} catch (error) {
		// Handle unexpected errors
		console.error("Unexpected tRPC error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
};

export { handler as GET, handler as POST };
