"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
	// Get authentication status from Clerk
	const { isLoaded, userId } = useAuth();
	const isAuthenticated = isLoaded && !!userId;

	return (
		<div className="max-w-4xl mx-auto">
			<div className="text-center mb-8">
				<h1 className="text-4xl font-bold mb-4">Welcome to OCFitShit</h1>
				<p className="text-xl text-gray-600">
					A Next.js application with Clerk authentication
				</p>
			</div>

			<div className="bg-white shadow-md rounded-lg p-6 mb-8">
				<h2 className="text-2xl font-semibold mb-4">
					Authentication with Clerk
				</h2>
				<p className="mb-4">
					This application demonstrates how to implement authentication using
					Clerk in a Next.js application.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
					<div className="border border-gray-200 rounded-md p-4">
						<h3 className="text-lg font-medium mb-2">Features Implemented</h3>
						<ul className="list-disc pl-5 space-y-1">
							<li>Clerk SDK integration in Next.js</li>
							<li>Login page</li>
							<li>Registration page</li>
							<li>Protected routes</li>
							<li>Admin role assignment</li>
						</ul>
					</div>

					<div className="border border-gray-200 rounded-md p-4">
						<h3 className="text-lg font-medium mb-2">Try It Out</h3>
						<p className="mb-4">
							{isAuthenticated
								? "You are currently logged in. Try accessing the protected pages."
								: "You are not logged in. Sign in to access protected pages."}
						</p>
						<div className="flex flex-col space-y-2">
							{!isAuthenticated && (
								<>
									<Link
										href="/login"
										className="bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700"
									>
										Sign In
									</Link>
									<Link
										href="/register"
										className="bg-green-600 text-white px-4 py-2 rounded text-center hover:bg-green-700"
									>
										Register
									</Link>
								</>
							)}
							{isAuthenticated && (
								<>
									<Link
										href="/dashboard"
										className="bg-purple-600 text-white px-4 py-2 rounded text-center hover:bg-purple-700"
									>
										Go to Dashboard
									</Link>
									<Link
										href="/admin"
										className="bg-gray-800 text-white px-4 py-2 rounded text-center hover:bg-gray-900"
									>
										Go to Admin Panel
									</Link>
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="bg-gray-50 rounded-lg p-6">
				<h2 className="text-xl font-semibold mb-4">Implementation Details</h2>
				<div className="space-y-4">
					<div>
						<h3 className="text-lg font-medium">1. Clerk SDK Integration</h3>
						<p className="text-gray-600">
							The Clerk SDK is integrated into the Next.js application using the
							ClerkProvider component.
						</p>
					</div>
					<div>
						<h3 className="text-lg font-medium">2. Authentication Pages</h3>
						<p className="text-gray-600">
							Login and registration pages are created using Clerk's pre-built
							components.
						</p>
					</div>
					<div>
						<h3 className="text-lg font-medium">3. Protected Routes</h3>
						<p className="text-gray-600">
							Routes are protected using Clerk's middleware and authentication
							checks.
						</p>
					</div>
					<div>
						<h3 className="text-lg font-medium">
							4. Role-Based Access Control
						</h3>
						<p className="text-gray-600">
							Admin role assignment is implemented using Clerk's user metadata.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
