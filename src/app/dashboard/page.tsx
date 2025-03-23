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
		<div className="bg-white shadow-md rounded-lg p-6">
			<h1 className="text-2xl font-bold mb-4">Dashboard</h1>
			<p className="mb-4">Welcome, {user.firstName}!</p>
			<p className="text-gray-600">
				This is a protected page. Only authenticated users can see this.
			</p>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="border border-gray-200 rounded-md p-4">
					<h2 className="text-lg font-medium mb-2">Your Profile</h2>
					<p className="text-gray-600">
						This section would display user profile information from Clerk.
					</p>
				</div>

				<div className="border border-gray-200 rounded-md p-4">
					<h2 className="text-lg font-medium mb-2">Account Settings</h2>
					<p className="text-gray-600">
						This section would allow users to manage their account settings.
					</p>
				</div>
			</div>
		</div>
	);
}
