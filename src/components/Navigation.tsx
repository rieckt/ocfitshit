"use client";

import { SignInButton, SignOutButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
	const { userId, isLoaded } = useAuth();
	const pathname = usePathname();

	// Function to determine if a link is active
	const isActive = (path: string) => {
		return pathname === path;
	};

	return (
		<nav className="bg-gray-800 text-white p-4">
			<div className="container mx-auto flex justify-between items-center">
				<div className="flex items-center space-x-4">
					<Link href="/" className="text-xl font-bold">
						OCFitShit
					</Link>

					<div className="hidden md:flex space-x-4">
						<Link
							href="/"
							className={`hover:text-gray-300 ${isActive("/") ? "text-white font-semibold" : "text-gray-300"}`}
						>
							Home
						</Link>

						{/* Only show dashboard link if user is authenticated */}
						{userId && (
							<Link
								href="/dashboard"
								className={`hover:text-gray-300 ${isActive("/dashboard") ? "text-white font-semibold" : "text-gray-300"}`}
							>
								Dashboard
							</Link>
						)}

						{/* Placeholder for admin link - we would check for admin role here */}
						{userId && (
							<Link
								href="/admin"
								className={`hover:text-gray-300 ${isActive("/admin") ? "text-white font-semibold" : "text-gray-300"}`}
							>
								Admin
							</Link>
						)}
					</div>
				</div>

				<div className="flex items-center space-x-4">
					{!isLoaded ? (
						// Show loading state
						<div className="h-8 w-20 bg-gray-700 animate-pulse rounded" />
					) : userId ? (
						// User is signed in
						<SignOutButton>
							<button
								type="button"
								className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
							>
								Sign Out
							</button>
						</SignOutButton>
					) : (
						// User is not signed in
						<>
							<SignInButton mode="modal">
								<button
									type="button"
									className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
								>
									Sign In
								</button>
							</SignInButton>
							<Link
								href="/register"
								className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
							>
								Register
							</Link>
						</>
					)}
				</div>
			</div>
		</nav>
	);
}
