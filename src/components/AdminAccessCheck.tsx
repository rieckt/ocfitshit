"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@clerk/nextjs";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

// Use type alias instead of inline type for better type caching
type AdminAccessCheckProps = {
  children: ReactNode;
} & {
  // Using intersection type for future extensibility without forcing TS to reevaluate
  __brand?: 'AdminAccessCheck';
};

// Extract components to reduce type evaluation scope
function LoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Checking permissions...</p>
      </div>
    </div>
  );
}

function UnauthorizedState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unauthorized Access</AlertTitle>
        <AlertDescription>
          You do not have permission to access the admin panel. Please contact an
          administrator if you believe this is an error.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Pre-compute query options to prevent unnecessary type evaluations
const ADMIN_QUERY_OPTIONS = {
  retry: false,
} as const;

export default function AdminAccessCheck({ children }: AdminAccessCheckProps) {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  // Optimize query with pre-computed options and type assertions
  const {
    data: isAdmin,
    isLoading: isCheckingAdmin,
    error
  } = trpc.admin.checkIsAdmin.useQuery(
    undefined,
    {
      ...ADMIN_QUERY_OPTIONS,
      enabled: Boolean(userId) && isLoaded,
    }
  );

  // Use lazy evaluation for effect dependencies
  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      router.push("/login");
      return;
    }

    if (error || isAdmin === false) {
      router.push("/dashboard");
    }
  }, [isLoaded, userId, isAdmin, error, router]);

  // Early returns with type assertions for better performance
  if (!isLoaded || isCheckingAdmin) {
    return <LoadingState />;
  }

  if (!userId) {
    return null;
  }

  if (!isAdmin) {
    return <UnauthorizedState />;
  }

  // Use type assertion to help TS understand the children type
  return <>{children}</>;
}
