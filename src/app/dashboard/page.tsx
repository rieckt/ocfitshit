import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
	// Check authentication status using Clerk's auth() function
	const { userId } = await auth();

	// If not authenticated, redirect to login
	if (!userId) {
		redirect("/login");
	}

	// Get the current user
	const user = await currentUser();

	// Handle case where user might be null
	if (!user) {
		redirect("/login");
	}

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Dashboard</h1>
			<p className="mb-4">Welcome, {user.username}!</p>
			<p className="text-muted-foreground mb-6">
				This is a protected page. Only authenticated users can see this.
			</p>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Your Profile</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							This section would display user profile information from Clerk.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Account Settings</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">
							This section would allow users to manage their account settings.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
