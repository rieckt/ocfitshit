import AdminUserManagementWrapper from "@/components/AdminUserManagementWrapper";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
	// Get the authentication status
	const { userId } = await auth();

	// If the user is not authenticated, redirect to the login page
	if (!userId) {
		redirect("/login");
	}

	// Get the user details
	const user = await currentUser();

	// Handle case where user might be null
	if (!user) {
		redirect("/login");
	}

	// Check if the user has the admin role
	const isAdmin = user.publicMetadata?.role === "admin";

	// If the user is not an admin, redirect to the dashboard
	if (!isAdmin) {
		redirect("/dashboard");
	}

	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
			<p>Welcome, Admin {user?.firstName}!</p>
			<p>
				This is a protected admin page. Only users with the admin role can see
				this.
			</p>

			<div className="mt-8">
				<h2 className="text-xl font-semibold mb-2">Admin Functions</h2>
				<ul className="list-disc pl-5">
					<li>User Management</li>
					<li>Content Moderation</li>
					<li>System Settings</li>
				</ul>
			</div>

			{/* Admin User Management Component */}
			<div className="mt-8">
				<AdminUserManagementWrapper />
			</div>
		</div>
	);
}
