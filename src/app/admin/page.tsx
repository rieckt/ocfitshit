'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { motion } from "framer-motion";
import {
    AlertCircle,
    ArrowRight,
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

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
}: {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ElementType;
    trend?: number;
}) {
    return (
        <motion.div variants={item}>
            <Card className="bg-background/50 backdrop-blur-sm border-muted">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold tracking-tight">
                        {value.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                            {subtitle}
                        </p>
                        {trend && (
                            <Badge variant={trend > 0 ? "default" : "secondary"} className="text-xs">
                                {trend > 0 ? '+' : ''}{trend}%
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                {message}
            </AlertDescription>
        </Alert>
    );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
    return (
        <motion.div
            variants={item}
            className="flex items-center gap-4 p-3 rounded-lg border border-muted bg-background/50 backdrop-blur-sm hover:bg-accent/10 transition-colors"
        >
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
                <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                        Level {activity.level}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">
                        {activity.createdAt && formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    return (
        <motion.div variants={item}>
            <Link href={href}>
                <Button
                    className="w-full justify-between group bg-background/50 backdrop-blur-sm border-muted hover:bg-accent/10"
                    variant="outline"
                    size="lg"
                >
                    <span className="flex items-center">
                        <Icon className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{label}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Button>
            </Link>
        </motion.div>
    );
}

function DashboardContent() {
    const { data, isLoading, error } = trpc.admin.getDashboardStats.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
    });

    if (error) {
        return <ErrorState message={error.message} />;
    }

    if (isLoading || !data) {
        return <LoadingState />;
    }

    const { stats, recentActivity } = data;

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="space-y-6"
        >
            {/* Quick Stats */}
            <motion.div
                variants={container}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    subtitle="Active platform users"
                    icon={Users}
                    trend={Math.round((stats.usersGrowth / stats.totalUsers) * 100)}
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
                    subtitle="Available exercises"
                    icon={Dumbbell}
                />
                <StatCard
                    title="Active Teams"
                    value={stats.activeTeams}
                    subtitle="Competing teams"
                    icon={Users}
                />
            </motion.div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activity */}
                <Card className="col-span-4 bg-background/50 backdrop-blur-sm border-muted">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                                <CardDescription>
                                    Latest user registrations and updates
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" asChild>
                                <Link href="/admin/users">
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                            <motion.div
                                variants={container}
                                className="space-y-4"
                            >
                                {recentActivity.map((activity) => (
                                    <ActivityItem key={activity.userId} activity={activity} />
                                ))}
                            </motion.div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="col-span-3 bg-background/50 backdrop-blur-sm border-muted">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                        <CardDescription>
                            Common administrative tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <motion.div
                            variants={container}
                            className="grid gap-4"
                        >
                            <QuickAction
                                href="/admin/users"
                                icon={Users}
                                label="Manage Users"
                            />
                            <QuickAction
                                href="/admin/challenges"
                                icon={Trophy}
                                label="Create Challenge"
                            />
                            <QuickAction
                                href="/admin/exercises"
                                icon={Dumbbell}
                                label="Add Exercise"
                            />
                            <QuickAction
                                href="/admin/seasons"
                                icon={Calendar}
                                label="Schedule Season"
                            />
                        </motion.div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-24" />
                            <div className="flex items-center justify-between mt-2">
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-48 mt-1" />
                            </div>
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-3 w-16" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
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
                            <Skeleton key={i} className="h-11 w-full" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <div className="space-y-6 p-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <LayoutDashboard className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
                        <p className="text-sm text-muted-foreground">
                            Welcome to the OCFitShit admin dashboard
                        </p>
                    </div>
                </div>
            </motion.div>

            <Suspense fallback={<LoadingState />}>
                <DashboardContent />
            </Suspense>
        </div>
    );
}
