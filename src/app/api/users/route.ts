import { type User, auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		// Check if the current user is an admin
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get the user to check if they're an admin
		const clerk = await clerkClient();
		const currentUser = await clerk.users.getUser(userId);
		const isAdmin = currentUser.publicMetadata?.role === "admin";

		if (!isAdmin) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Fetch all users
		const usersResponse = await clerk.users.getUserList({
			limit: 100,
		});

		// Map the Clerk user data to our User interface format
		const users = usersResponse.data.map((user: User) => ({
			id: user.id,
			firstName: user.firstName || "",
			lastName: user.lastName || "",
			email: user.emailAddresses[0]?.emailAddress || "",
			isAdmin: user.publicMetadata?.role === "admin",
		}));

		return NextResponse.json({ users }, { status: 200 });
	} catch (error) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ error: "Failed to fetch users" },
			{ status: 500 },
		);
	}
}
