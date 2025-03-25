'use client';

import AdminAccessCheck from "@/components/AdminAccessCheck";
import { trpc } from "@/lib/trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";

export default function AdminClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Setup React Query and tRPC
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: '/api/trpc',
                    transformer: superjson,
                }),
            ],
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                <AdminAccessCheck>
                    {children}
                </AdminAccessCheck>
            </QueryClientProvider>
        </trpc.Provider>
    );
}
