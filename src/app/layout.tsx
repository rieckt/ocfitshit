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
	title: "OCFitShit",
	description: "OCFitShit",
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
						<Toaster
							position="top-right"
							expand={false}
							closeButton
							theme="system"
							className="!font-geist-sans"
							toastOptions={{
								classNames: {
									toast: "!bg-zinc-950/50 !backdrop-blur-xl !border !border-zinc-800/50 !shadow-lg dark:!shadow-black/20",
									title: "!text-zinc-100",
									description: "!text-zinc-400",
									actionButton: "!bg-zinc-100 !text-zinc-900 hover:!bg-zinc-200",
									cancelButton: "!bg-zinc-800 !text-zinc-100 hover:!bg-zinc-700",
									success: "!bg-emerald-950/50 !border-emerald-800/50",
									error: "!bg-rose-950/50 !border-rose-800/50",
									warning: "!bg-amber-950/50 !border-amber-800/50",
									info: "!bg-sky-950/50 !border-sky-800/50"
								}
							}}
						/>
						<div className="flex min-h-screen flex-col">
							<Navigation />
							<main className="flex-1 px-4 py-8">{children}</main>
						</div>
					</Providers>
				</ClerkProvider>
			</body>
		</html>
	);
}
