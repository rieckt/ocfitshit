"use client";

import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SignInButton, SignOutButton, useAuth, useUser } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export default function Navigation() {
	const { userId, isLoaded } = useAuth();
	const { user } = useUser();
	const pathname = usePathname();

	// Function to determine if a link is active
	const isActive = (path: string) => {
		return pathname === path;
	};

	// Check if user is admin
	const isAdmin = user?.publicMetadata?.role === "admin";

	// Handle secure navigation with permission checks
	const handleNavigation = (href: string, requiresAdmin = false) => {
		// If requires admin and user is not admin
		if (requiresAdmin && !isAdmin) {
			toast.error("You don't have permission to access the admin area");
			return false;
		}

		return true;
	};

	// Navigation links array to use in both desktop and mobile nav
	const navLinks = [
		{ href: "/", label: "Home", requireAuth: false, requireAdmin: false },
		{ href: "/dashboard", label: "Dashboard", requireAuth: true, requireAdmin: false },
		{ href: "/admin", label: "Admin", requireAuth: true, requireAdmin: true },
	];

	return (
		<>
			<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="flex h-16 items-center justify-between px-4">
					<div className="flex items-center gap-6">
						<Link href="/" className="font-bold text-xl">
							OCFitShit
						</Link>

						{/* Desktop Navigation */}
						<NavigationMenu className="hidden md:flex">
							<NavigationMenuList>
								{navLinks.map((link) => {
									// Only show if not requiring auth or user is logged in
									if (!link.requireAuth || userId) {
										// Hide admin links for non-admins
										if (link.requireAdmin && !isAdmin) {
											return null;
										}

										return (
											<NavigationMenuItem key={link.href}>
												<Link
													href={link.href}
													legacyBehavior
													passHref
													onClick={(e) => {
														if (!handleNavigation(link.href, link.requireAdmin)) {
															e.preventDefault();
														}
													}}
												>
													<NavigationMenuLink className={navigationMenuTriggerStyle()}>
														{link.label}
													</NavigationMenuLink>
												</Link>
											</NavigationMenuItem>
										);
									}
									return null;
								})}
							</NavigationMenuList>
						</NavigationMenu>

						{/* Mobile Navigation */}
						<div className="md:hidden">
							<Sheet>
								<SheetTrigger asChild>
									<Button variant="ghost" size="icon" className="h-10 w-10">
										<Menu className="h-5 w-5" />
										<span className="sr-only">Toggle menu</span>
									</Button>
								</SheetTrigger>
								<SheetContent side="left">
									<div className="px-2 py-6 flex flex-col gap-4">
										<Link href="/" className="font-bold text-xl px-2">
											OCFitShit
										</Link>
										<div className="flex flex-col gap-2">
											{navLinks.map((link) => {
												// Only show if not requiring auth or user is logged in
												if (!link.requireAuth || userId) {
													// Hide admin links for non-admins
													if (link.requireAdmin && !isAdmin) {
														return null;
													}

													return (
														<Link
															key={link.href}
															href={link.href}
															className={`px-2 py-1 rounded-md ${
																isActive(link.href)
																	? "bg-accent text-accent-foreground"
																	: "hover:bg-accent/50"
															}`}
															onClick={(e) => {
																if (!handleNavigation(link.href, link.requireAdmin)) {
																	e.preventDefault();
																}
															}}
														>
															{link.label}
														</Link>
													);
												}
												return null;
											})}
										</div>
									</div>
								</SheetContent>
							</Sheet>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{!isLoaded ? (
							// Show loading state
							<div className="h-9 w-24 animate-pulse rounded bg-muted" />
						) : userId ? (
							// User is signed in
							<SignOutButton>
								<Button variant="destructive">
									Sign Out
								</Button>
							</SignOutButton>
						) : (
							// User is not signed in
							<>
								<SignInButton mode="modal">
									<Button>
										Sign In
									</Button>
								</SignInButton>
								<Button variant="outline" asChild>
									<Link href="/register">
										Register
									</Link>
								</Button>
							</>
						)}
					</div>
				</div>
			</header>
		</>
	);
}
