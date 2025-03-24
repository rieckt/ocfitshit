import db from "@/db";
import { userProfiles } from "@/db/schema";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

// Webhook secret key from Clerk Dashboard
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET ?? "";

export async function POST(req: Request) {
	// Get the raw body
	const rawBody = await req.text();

	// Get the headers
	const headersList = await headers();
	const svix_id = headersList.get("svix-id");
	const svix_timestamp = headersList.get("svix-timestamp");
	const svix_signature = headersList.get("svix-signature");

	// If there are no headers, error out
	if (!svix_id || !svix_timestamp || !svix_signature) {
		return new NextResponse(
			JSON.stringify({
				error: "Missing svix headers",
				headers: { svix_id, svix_timestamp, svix_signature },
			}),
			{ status: 400 },
		);
	}

	// Initialize the webhook instance
	const wh = new Webhook(webhookSecret);
	let payload: WebhookEvent;

	try {
		// Verify the webhook and get the payload
		payload = wh.verify(rawBody, {
			"svix-id": svix_id,
			"svix-timestamp": svix_timestamp,
			"svix-signature": svix_signature,
		}) as WebhookEvent;
	} catch (err) {
		console.error("Webhook verification failed:", err);
		return new NextResponse(
			JSON.stringify({
				error: "Webhook verification failed",
				details: err instanceof Error ? err.message : String(err),
			}),
			{ status: 400 },
		);
	}

	// Handle the webhook payload
	try {
		const { type, data } = payload;
		console.log("Webhook event type:", type);
		console.log("Webhook data:", data);

		// Handle user.created event
		if (type === "user.created") {
			const { id, email_addresses, first_name, last_name, image_url } = data;

			// Get the primary email
			const primaryEmail = email_addresses?.[0]?.email_address;

			// Create user profile
			await db.insert(userProfiles).values({
				userId: id,
				displayName:
					first_name && last_name
						? `${first_name} ${last_name}`
						: (primaryEmail?.split("@")[0] ?? id),
				avatarUrl: image_url,
				level: 1,
				totalPoints: 0,
			});

			return new NextResponse(
				JSON.stringify({ message: "User profile created successfully" }),
				{ status: 201 },
			);
		}

		// Return 200 for other event types
		return new NextResponse(
			JSON.stringify({ message: `Webhook received: ${type}` }),
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error processing webhook:", error);
		return new NextResponse(
			JSON.stringify({
				error: "Error processing webhook",
				details: error instanceof Error ? error.message : String(error),
			}),
			{ status: 500 },
		);
	}
}
