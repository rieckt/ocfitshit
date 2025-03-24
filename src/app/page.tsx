"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
				<p className="text-xl text-muted-foreground">
					A Next.js application with Clerk authentication
				</p>
			</div>

			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Authentication with Clerk</CardTitle>
					<CardDescription>
						This application demonstrates how to implement authentication using
						Clerk in a Next.js application.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="border border-border rounded-md p-4">
							<h3 className="text-lg font-medium mb-2">Features Implemented</h3>
							<ul className="list-disc pl-5 space-y-1">
								<li>Clerk SDK integration in Next.js</li>
								<li>Login page</li>
								<li>Registration page</li>
								<li>Protected routes</li>
								<li>Admin role assignment</li>
							</ul>
						</div>

						<div className="border border-border rounded-md p-4">
							<h3 className="text-lg font-medium mb-2">Try It Out</h3>
							<p className="mb-4">
								{isAuthenticated
									? "You are currently logged in. Try accessing the protected pages."
									: "You are not logged in. Sign in to access protected pages."}
							</p>
							<div className="flex flex-col space-y-2">
								{!isAuthenticated && (
									<>
										<Button asChild className="w-full">
											<Link href="/login">
												Sign In
											</Link>
										</Button>
										<Button asChild variant="outline" className="w-full">
											<Link href="/register">
												Register
											</Link>
										</Button>
									</>
								)}
								{isAuthenticated && (
									<>
										<Button asChild className="w-full">
											<Link href="/dashboard">
												Go to Dashboard
											</Link>
										</Button>
										<Button asChild variant="secondary" className="w-full">
											<Link href="/admin">
												Go to Admin Panel
											</Link>
										</Button>
									</>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="bg-muted/50">
				<CardHeader>
					<CardTitle>Implementation Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="text-lg font-medium flex items-center">
							<Badge variant="outline" className="mr-2">1</Badge>
							Clerk SDK Integration
						</h3>
						<p className="text-muted-foreground">
							The Clerk SDK is integrated into the Next.js application using the
							ClerkProvider component.
						</p>
					</div>
					<div>
						<h3 className="text-lg font-medium flex items-center">
							<Badge variant="outline" className="mr-2">2</Badge>
							Authentication Pages
						</h3>
						<p className="text-muted-foreground">
							Login and registration pages are created using Clerk's pre-built
							components.
						</p>
					</div>
					<div>
						<h3 className="text-lg font-medium flex items-center">
							<Badge variant="outline" className="mr-2">3</Badge>
							Protected Routes
						</h3>
						<p className="text-muted-foreground">
							Routes are protected using Clerk's middleware and authentication
							checks.
						</p>
					</div>
					<div>
						<h3 className="text-lg font-medium flex items-center">
							<Badge variant="outline" className="mr-2">4</Badge>
							Role-Based Access Control
						</h3>
						<p className="text-muted-foreground">
							Admin role assignment is implemented using Clerk's user metadata.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
