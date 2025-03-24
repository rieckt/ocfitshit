import AdminAccessCheck from "@/components/AdminAccessCheck";
import AdminUserManagement from "@/components/AdminUserManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function AdminUsersPage() {
	return (
		<AdminAccessCheck>
			<div className="space-y-6 p-6 lg:px-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Users className="h-8 w-8 text-primary" />
						<div>
							<h1 className="text-2xl font-semibold">User Management</h1>
							<p className="text-sm text-muted-foreground">
								Manage user accounts and permissions
							</p>
						</div>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>User Management</CardTitle>
						<CardDescription>
							View and manage all users in the system
						</CardDescription>
					</CardHeader>
					<CardContent>
						<AdminUserManagement />
					</CardContent>
				</Card>
			</div>
		</AdminAccessCheck>
	);
}
