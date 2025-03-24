'use client';

import AdminAccessCheck from "@/components/AdminAccessCheck";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import {
    Calendar,
    Dumbbell,
    LayoutDashboard,
    Trophy,
    Users
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

interface DashboardStats {
    totalUsers: number;
    activeChallenges: number;
    exerciseCount: number;
    activeTeams: number;
    usersGrowth: number;
}

interface RecentActivity {
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
    level: number;
    createdAt: Date | null;
}

interface DashboardData {
    stats: DashboardStats;
    recentActivity: RecentActivity[];
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon
}: {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ElementType;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">
                    {subtitle}
                </p>
            </CardContent>
        </Card>
    );
}

function DashboardContent() {
    const { data, isLoading } = trpc.admin.getDashboardStats.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
    });

    if (isLoading || !data) {
        return <LoadingState />;
    }

    const { stats, recentActivity } = data;

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    subtitle={`+${stats.usersGrowth} from last month`}
                    icon={Users}
                />
                <StatCard
                    title="Active Challenges"
                    value={stats.activeChallenges}
                    subtitle="Currently running"
                    icon={Trophy}
                />
                <StatCard
                    title="Exercise Types"
                    value={stats.exerciseCount}
                    subtitle="Total exercises"
                    icon={Dumbbell}
                />
                <StatCard
                    title="Active Teams"
                    value={stats.activeTeams}
                    subtitle="Competing teams"
                    icon={Users}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activity */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest actions across the platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <div key={activity.userId} className="flex items-center gap-4 rounded-lg border p-3">
                                        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-primary/10">
                                            {activity.avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={activity.avatarUrl}
                                                    alt={activity.displayName || "User"}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Users className="h-6 w-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {activity.displayName || "Anonymous User"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Joined at Level {activity.level}
                                            </p>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {activity.createdAt && formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common administrative tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Link href="/admin/users">
                            <Button className="w-full justify-start" variant="outline">
                                <Users className="mr-2 h-4 w-4" />
                                Manage Users
                            </Button>
                        </Link>
                        <Link href="/admin/challenges">
                            <Button className="w-full justify-start" variant="outline">
                                <Trophy className="mr-2 h-4 w-4" />
                                Create Challenge
                            </Button>
                        </Link>
                        <Link href="/admin/exercises">
                            <Button className="w-full justify-start" variant="outline">
                                <Dumbbell className="mr-2 h-4 w-4" />
                                Add Exercise
                            </Button>
                        </Link>
                        <Link href="/admin/seasons">
                            <Button className="w-full justify-start" variant="outline">
                                <Calendar className="mr-2 h-4 w-4" />
                                Schedule Season
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="mt-2 h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <AdminAccessCheck>
            <div className="space-y-6 p-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
                            <p className="text-sm text-muted-foreground">
                                Welcome to the OCFitShit admin dashboard
                            </p>
                        </div>
                    </div>
                </div>

                <Suspense fallback={<LoadingState />}>
                    <DashboardContent />
                </Suspense>
            </div>
        </AdminAccessCheck>
    );
}
