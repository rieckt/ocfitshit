"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type AdminAccessCheckProps = {
  children: React.ReactNode;
};

export default function AdminAccessCheck({ children }: AdminAccessCheckProps) {
  const router = useRouter();
  const { userId, isLoaded, sessionId } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      if (!isLoaded) return;

      if (!userId || !sessionId) {
        if (isMounted) {
          setIsChecking(false);
          toast.error("You need to be logged in to access the admin area");
        }
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/check-admin", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to check admin status");
        }

        const data = await response.json();

        if (isMounted) {
          setIsAdmin(data.isAdmin);
          if (!data.isAdmin) {
            toast.error("You don't have permission to access the admin area");
            router.push("/dashboard");
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (isMounted) {
          toast.error("Something went wrong checking your permissions");
        }
        router.push("/dashboard");
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, userId, sessionId, router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return isAdmin ? <>{children}</> : null;
}
