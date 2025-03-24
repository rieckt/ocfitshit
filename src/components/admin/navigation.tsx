"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    BarChart,
    Calendar,
    Dumbbell,
    LayoutDashboard,
    Menu,
    Settings,
    Shield,
    Trophy,
    Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
    {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        description: "Overview of your fitness competition",
        color: "text-blue-500",
        gradient: "from-blue-500/10 to-blue-500/5"
    },
    {
        name: "User Management",
        href: "/admin/users",
        icon: Users,
        description: "Manage users and permissions",
        color: "text-indigo-500",
        gradient: "from-indigo-500/10 to-indigo-500/5"
    },
    {
        name: "Exercise Management",
        href: "/admin/exercises",
        icon: Dumbbell,
        description: "Configure available exercises",
        color: "text-purple-500",
        gradient: "from-purple-500/10 to-purple-500/5"
    },
    {
        name: "Seasons",
        href: "/admin/seasons",
        icon: Calendar,
        description: "Manage competition seasons",
        color: "text-green-500",
        gradient: "from-green-500/10 to-green-500/5"
    },
    {
        name: "Challenges",
        href: "/admin/challenges",
        icon: Trophy,
        description: "Create and manage challenges",
        color: "text-yellow-500",
        gradient: "from-yellow-500/10 to-yellow-500/5"
    },
    {
        name: "Teams",
        href: "/admin/teams",
        icon: Users,
        description: "Manage competition teams",
        color: "text-pink-500",
        gradient: "from-pink-500/10 to-pink-500/5"
    },
    {
        name: "Level System",
        href: "/admin/levels",
        icon: BarChart,
        description: "Configure progression system",
        color: "text-orange-500",
        gradient: "from-orange-500/10 to-orange-500/5"
    },
    {
        name: "Settings",
        href: "/admin/settings",
        icon: Settings,
        description: "System configuration",
        color: "text-slate-500",
        gradient: "from-slate-500/10 to-slate-500/5"
    },
];

interface AdminNavigationProps {
    user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        imageUrl: string;
    };
}

export function AdminNavigation({ user }: AdminNavigationProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const NavigationContent = () => (
        <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/95">
            <ScrollArea className="flex-1">
                <div className="px-6 py-5 border-b border-border/5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold tracking-tight">Admin Dashboard</h2>
                            <p className="text-xs text-muted-foreground">Manage your fitness competition</p>
                        </div>
                    </div>
                </div>
                <nav className="flex flex-1 flex-col gap-2 p-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`group relative flex items-center gap-x-3 rounded-xl p-3 text-sm transition-all duration-200 hover:bg-gradient-to-r hover:from-background hover:to-accent/5 ${
                                    isActive
                                        ? `bg-gradient-to-r ${item.gradient} shadow-sm`
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                                    isActive
                                        ? `${item.color} bg-gradient-to-b from-white/10 to-white/5 shadow-sm ring-1 ring-white/10`
                                        : "bg-accent/50 text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
                                }`}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className={`font-medium transition-colors duration-200 ${
                                        isActive ? item.color : "group-hover:text-foreground"
                                    }`}>
                                        {item.name}
                                    </span>
                                    <span className={`text-[11px] font-medium ${
                                        isActive ? "text-foreground/70" : "text-muted-foreground group-hover:text-foreground/70"
                                    }`}>
                                        {item.description}
                                    </span>
                                </div>
                                {isActive && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <div className={`h-1.5 w-1.5 rounded-full ${item.color} animate-pulse`} />
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>
        </div>
    );

    return (
        <>
            {/* Mobile drawer */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="fixed left-4 top-3 z-40 h-9 w-9 shrink-0 rounded-lg border border-border/40 bg-background/95 shadow-sm backdrop-blur-xl transition-all duration-200 hover:bg-accent hover:shadow-md lg:hidden"
                    >
                        <Menu className="h-4 w-4" />
                        <span className="sr-only">Toggle admin menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent
                    side="left"
                    className="w-80 border-r-0 bg-background/95 p-0 backdrop-blur-xl"
                >
                    <NavigationContent />
                </SheetContent>
            </Sheet>

            {/* Desktop sidebar */}
            <div className="fixed top-16 left-0 z-30 hidden h-[calc(100vh-4rem)] w-80 lg:block">
                <div className="flex h-full flex-col overflow-hidden border-r border-border/5 bg-background/95 backdrop-blur-xl">
                    <NavigationContent />
                </div>
            </div>
        </>
    );
}
