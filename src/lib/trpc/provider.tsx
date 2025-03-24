"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./client";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 1000, // 5 seconds
						retry: 1,
						refetchOnWindowFocus: false,
					},
				},
			})
	);

	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				// Adds pretty logs to your console in development
				loggerLink({
					enabled: (opts) =>
						process.env.NODE_ENV === "development" ||
						(opts.direction === "down" && opts.result instanceof Error),
				}),
				httpBatchLink({
					url: "/api/trpc",
					transformer: superjson,
					// Add custom headers here if needed
					headers() {
						return {
							// Example: authorization: getAuthCookie(),
						};
					},
				}),
			],
		})
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	);
}
