"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { type ReactNode, useState } from "react";
import superjson from "superjson";
import { trpc } from "./client";
import type { AppRouter } from "./root";

// Pre-compute options to reduce type evaluation overhead
const QUERY_CLIENT_OPTIONS = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      gcTime: 10 * 60 * 1000,
    },
  },
} as const;

// Pre-compute link options with correct types
const isDev = process.env.NODE_ENV === "development";

const BATCH_LINK_OPTIONS = {
  url: "/api/trpc",
  transformer: superjson,
  headers: () => ({
    "x-trpc-source": "react",
  }),
} as const;

// Export types for better DX
export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

type ProviderProps = {
  children: ReactNode;
  // Using branded type for better type caching
  __brand?: 'TRPCProvider';
};

// Memoize client creation functions to prevent unnecessary type evaluations
const createQueryClient = () => new QueryClient(QUERY_CLIENT_OPTIONS);

const createTrpcClient = () => trpc.createClient({
  links: [
    loggerLink({
      enabled: (opts) =>
        isDev || (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpBatchLink(BATCH_LINK_OPTIONS),
  ],
});

export function TRPCProvider({ children }: ProviderProps) {
  // Use memoized creation functions
  const [queryClient] = useState(createQueryClient);
  const [trpcClient] = useState(createTrpcClient);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
