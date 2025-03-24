'use client';

import { ThemeProvider } from "@/components/theme-provider";
import { TRPCProvider } from "@/lib/trpc/provider";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);

	// useEffect only runs on the client, so we can safely show the UI
	useEffect(() => {
		setMounted(true);
	}, []);

	// Return children without Providers during SSR
	if (!mounted) {
		return <>{children}</>;
	}

	// Wrap with Providers after component has mounted on client
	return (
		<TRPCProvider>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
			>
				{children}
			</ThemeProvider>
		</TRPCProvider>
	);
}
