import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes
const isPublicRoute = createRouteMatcher([
	"/",
	"/login(.*)",
	"/sign-in(.*)",
	"/register(.*)",
	"/sign-up(.*)",
	"/user(.*)",
	"/api/webhooks/clerk(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
	// Handle redirect from /register to /sign-up
	const url = new URL(request.url);
	if (url.pathname.startsWith("/register")) {
		const newPath = url.pathname.replace("/register", "/sign-up");
		return NextResponse.redirect(new URL(newPath, request.url));
	}

	if (!isPublicRoute(request)) {
		await auth.protect();
	}
});

// Stop Middleware from running on static files and public assets
export const config = {
	matcher: [
		// Skip Next.js internals and all static files
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
