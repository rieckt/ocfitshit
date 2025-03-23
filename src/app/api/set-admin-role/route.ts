import { clerkClient } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		// Parse the request body
		const { userId } = await request.json();

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		// Update the user's metadata to include the admin role
		const clerk = await clerkClient();
		await clerk.users.updateUser(userId, {
			publicMetadata: { role: "admin" },
		});

		return NextResponse.json(
			{ success: true, message: "Admin role assigned successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error assigning admin role:", error);
		return NextResponse.json(
			{ error: "Failed to assign admin role" },
			{ status: 500 },
		);
	}
}
