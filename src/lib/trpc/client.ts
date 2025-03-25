import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "./root";

// Create tRPC client with lazy type evaluation
export const trpc = createTRPCReact<AppRouter>();

// Export branded type for better type caching
export type TRPCClient = typeof trpc & { __brand: 'TRPCClient' };
