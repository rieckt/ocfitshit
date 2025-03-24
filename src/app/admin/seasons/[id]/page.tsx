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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft, Calendar, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

/**
 * Format a date safely with error handling
 */
const formatDateSafe = (date: Date | string, pattern: string = "dd/MM/yyyy"): string => {
    try {
        return format(new Date(date), pattern, { locale: de });
    } catch (error) {
        console.error("Date formatting error:", error);
        return "Invalid date";
    }
};

/**
 * Component for displaying season details
 */
function SeasonDetails() {
    const params = useParams();
    const id = params.id as string;
    const { data: season, isLoading } = trpc.season.getById.useQuery({ id });

    if (isLoading) {
        return <LoadingState />;
    }

    if (!season) {
        return <NotFoundState />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/seasons">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold">{season.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {formatDateSafe(season.startsAt)} - {formatDateSafe(season.endsAt)}
                        </p>
                    </div>
                </div>
                <div className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium",
                    season.isActive
                        ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                        : "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20"
                )}>
                    {season.isActive ? 'Active' : 'Inactive'}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Duration</h3>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {formatDateSafe(season.startsAt, "MMMM d, yyyy")} -<br />
                            {formatDateSafe(season.endsAt, "MMMM d, yyyy")}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Challenges</h3>
                        </div>
                        <p className="mt-2 text-2xl font-semibold">
                            {season.challenges?.length || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Total challenges</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Participants</h3>
                        </div>
                        <p className="mt-2 text-2xl font-semibold">
                            0
                        </p>
                        <p className="text-sm text-muted-foreground">Active participants</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Challenges</CardTitle>
                    <CardDescription>
                        All challenges in this season
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {season.challenges && season.challenges.length > 0 ? (
                        <div className="divide-y">
                            {season.challenges.map((challenge) => (
                                <div
                                    key={challenge.id}
                                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                                >
                                    <div>
                                        <h4 className="font-medium">{challenge.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {challenge.startsAt && challenge.endsAt
                                                ? `${formatDateSafe(challenge.startsAt)} - ${formatDateSafe(challenge.endsAt)}`
                                                : 'No dates set'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm">
                                            <span className="font-medium">{challenge.pointsMultiplier}x</span>
                                            <span className="text-muted-foreground"> multiplier</span>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            View
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Trophy className="h-12 w-12 text-muted-foreground/30" />
                            <h3 className="mt-4 text-lg font-semibold">No Challenges Yet</h3>
                            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                                Create your first challenge to start tracking progress in this season.
                            </p>
                            <Button className="mt-4">
                                Create Challenge
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Loading state component
 */
function LoadingState() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8" />
                <div>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="mt-2 h-4 w-40" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Not found state component
 */
function NotFoundState() {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-semibold">Season Not Found</h3>
                <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                    The season you're looking for doesn't exist or has been deleted.
                </p>
                <Link href="/admin/seasons">
                    <Button className="mt-4">
                        Back to Seasons
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

/**
 * Main page component
 */
export default function SeasonDetailsPage() {
    return (
        <AdminAccessCheck>
            <div className="space-y-6 p-6 lg:px-8">
                <SeasonDetails />
            </div>
        </AdminAccessCheck>
    );
}
