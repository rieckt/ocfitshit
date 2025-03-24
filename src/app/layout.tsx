import Navigation from "@/components/Navigation";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
	display: "swap",
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "OCFitShit - Authentication with Clerk",
	description: "A Next.js application with Clerk authentication",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				suppressHydrationWarning
			>
				<ClerkProvider>
					<Providers>
						<Toaster richColors position="top-center" />
						<div className="flex min-h-screen flex-col">
							<Navigation />
							<main className="container mx-auto flex-1 px-4 py-8">{children}</main>
						</div>
					</Providers>
				</ClerkProvider>
			</body>
		</html>
	);
}
