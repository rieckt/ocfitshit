import AdminAccessCheck from "@/components/AdminAccessCheck";
import AdminExerciseManagement from "@/components/AdminExerciseManagement";
import AdminUserManagement from "@/components/AdminUserManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currentUser } from "@clerk/nextjs/server";
import { Toaster } from "sonner";

export default async function AdminPage() {
	// Get the user details for displaying name
	const user = await currentUser();

	return (
		<>
			<Toaster position="top-center" />
			<AdminAccessCheck>
				<div className="container mx-auto py-8 px-4 max-w-7xl">
					<div className="mb-8">
						<h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
						<p className="text-muted-foreground mt-2">
							Manage users, exercises, and more for the fitness competition
						</p>
					</div>

					<div className="bg-card rounded-lg border shadow-sm">
						<Tabs defaultValue="users" className="w-full">
							<div className="px-4 pt-4">
								<TabsList className="mb-4 w-full sm:w-auto">
									<TabsTrigger value="users" className="flex items-center gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
										User Management
									</TabsTrigger>
									<TabsTrigger value="exercises" className="flex items-center gap-2">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dumbbell"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
										Exercise Management
									</TabsTrigger>
								</TabsList>
							</div>
							<TabsContent value="users" className="p-4">
								<AdminUserManagement />
							</TabsContent>
							<TabsContent value="exercises" className="p-4">
								<AdminExerciseManagement />
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</AdminAccessCheck>
		</>
	);
}
