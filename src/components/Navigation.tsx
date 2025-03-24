"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignInButton, SignOutButton, useAuth, useUser } from "@clerk/nextjs";
import { ChevronDown, Dumbbell, LogOut, Settings, Shield, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
	const { userId, isLoaded } = useAuth();
	const { user } = useUser();
	const pathname = usePathname();

	// Function to determine if a link is active
	const isActive = (path: string) => pathname === path;

	// Check if user is admin
	const isAdmin = user?.publicMetadata?.role === "admin";

	// Navigation links array to use in both desktop and mobile nav
	const navLinks = [
		{
			href: "/",
			label: "Home",
			requireAuth: false,
			requireAdmin: false,
			description: "Return to homepage"
		},
		{
			href: "/dashboard",
			label: "Dashboard",
			requireAuth: true,
			requireAdmin: false,
			description: "View your fitness progress"
		},
	];

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
			<nav className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-6">
					<Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
							<Dumbbell className="h-5 w-5 text-primary" />
						</div>
						<span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-xl font-bold text-transparent">
							OCFitShit
						</span>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex md:gap-1">
						{navLinks.map((link) => {
							// Only show if not requiring auth or user is logged in
							if (!link.requireAuth || userId) {
								// Hide admin links for non-admins
								if (link.requireAdmin && !isAdmin) return null;

								const active = isActive(link.href);
								return (
									<Button
										key={link.href}
										variant={active ? "secondary" : "ghost"}
										className={`relative h-9 px-4 text-sm transition-all hover:scale-105 ${
											active ? "bg-primary/10 text-primary hover:bg-primary/15" : ""
										}`}
										asChild
									>
										<Link href={link.href}>
											<span>{link.label}</span>
											{active && (
												<div className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />
											)}
										</Link>
									</Button>
								);
							}
							return null;
						})}
					</div>
				</div>

				<div className="flex items-center gap-2">
					{!isLoaded ? (
						// Show loading state
						<div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
					) : userId ? (
						// User is signed in
						<div className="flex items-center gap-2">
							{isAdmin && (
								<Button
									variant={pathname.startsWith("/admin") ? "secondary" : "ghost"}
									size="sm"
									className={`gap-2 transition-all hover:scale-105 ${
										pathname.startsWith("/admin") ? "bg-primary/10 text-primary hover:bg-primary/15" : ""
									}`}
									asChild
								>
									<Link href="/admin">
										<Shield className="h-4 w-4" />
										Admin
									</Link>
								</Button>
							)}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="gap-2 transition-all hover:scale-105"
									>
										<div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
											<User className="h-4 w-4 text-primary" />
										</div>
										<span className="font-medium">{user?.firstName}</span>
										<ChevronDown className="h-3 w-3 opacity-50" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-56 animate-in fade-in-0 zoom-in-95"
								>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col space-y-1">
											<p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
											<p className="text-xs leading-none text-muted-foreground">{user?.emailAddresses[0].emailAddress}</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/settings" className="flex w-full cursor-pointer items-center">
											<Settings className="mr-2 h-4 w-4 text-muted-foreground" />
											Settings
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem
										asChild
										className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950"
									>
										<SignOutButton>
											<button className="flex w-full items-center">
												<LogOut className="mr-2 h-4 w-4" />
												Sign Out
											</button>
										</SignOutButton>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					) : (
						// User is not signed in
						<div className="flex items-center gap-2">
							<SignInButton mode="modal">
								<Button
									size="sm"
									variant="ghost"
									className="transition-all hover:scale-105 hover:bg-primary/10 hover:text-primary"
								>
									Sign In
								</Button>
							</SignInButton>
							<Button
								variant="default"
								size="sm"
								className="transition-all hover:scale-105"
								asChild
							>
								<Link href="/register">Register</Link>
							</Button>
						</div>
					)}
				</div>
			</nav>
		</header>
	);
}

// Helper function to conditionally join class names
const cn = (...classes: (string | boolean | undefined)[]) => {
	return classes.filter(Boolean).join(" ");
};
