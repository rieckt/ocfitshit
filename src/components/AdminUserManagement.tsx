"use client";

import { useCallback, useEffect, useState } from "react";

import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui";

interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	isAdmin: boolean;
}

type RoleBadgeProps = {
	isAdmin: boolean;
};

export default function AdminUserManagement() {
	const [userId, setUserId] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [users, setUsers] = useState<User[]>([]);
	const [isLoadingUsers, setIsLoadingUsers] = useState(true);

	const fetchUsers = useCallback(async () => {
		setIsLoadingUsers(true);
		try {
			const response = await fetch("/api/users");
			if (!response.ok) {
				throw new Error("Failed to fetch users");
			}
			const data = await response.json();
			setUsers(data.users);
		} catch (err) {
			console.error("Error fetching users:", err);
			setError("Failed to load users");
		} finally {
			setIsLoadingUsers(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const assignAdminRole = async (userId: string) => {
		setLoading(true);
		setMessage("");
		setError("");

		try {
			const response = await fetch("/api/set-admin-role", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId }),
			});

			const data = await response.json();

			if (response.ok) {
				setMessage(data.message || "Admin role assigned successfully");
				fetchUsers();
			} else {
				setError(data.error || "Failed to assign admin role");
			}
		} catch (error) {
			setError("An error occurred while assigning the admin role");
			console.error("Error:", error);
		} finally {
			setLoading(false);
			setUserId("");
		}
	};

	const RoleBadge = ({ isAdmin }: RoleBadgeProps) => {
		return isAdmin ? (
			<Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800">
				Admin
			</Badge>
		) : (
			<Badge variant="outline" className="text-gray-600">
				User
			</Badge>
		);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUserId(e.target.value);
	};

	return (
		<Card className="mt-6">
			<CardHeader>
				<CardTitle>User Management</CardTitle>
				<CardDescription>
					Manage user roles and permissions for the application
				</CardDescription>
			</CardHeader>
			<CardContent>
				{message && (
					<Alert className="mb-6" variant="default">
						<AlertTitle>Success</AlertTitle>
						<AlertDescription>{message}</AlertDescription>
					</Alert>
				)}

				{error && (
					<Alert className="mb-6" variant="destructive">
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<div className="space-y-6">
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Assign Admin Role</h3>
						<div className="flex items-center gap-2">
							<Input
								type="text"
								value={userId}
								onChange={handleInputChange}
								placeholder="Enter User ID"
								className="flex-1"
							/>
							<Button
								onClick={() => assignAdminRole(userId)}
								disabled={loading || !userId}
							>
								{loading ? "Assigning..." : "Assign Admin Role"}
							</Button>
						</div>
						<p className="text-sm text-muted-foreground">
							Enter the User ID of the user you want to assign the admin role
							to.
						</p>
					</div>

					<div className="space-y-4">
						<h3 className="text-lg font-medium">User List</h3>
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isLoadingUsers ? (
										renderSkeletonRows()
									) : users.length > 0 ? (
										users.map((user) => (
											<TableRow key={user.id}>
												<TableCell>
													<div className="font-medium">
														{user.firstName} {user.lastName}
													</div>
													<div className="mt-1 text-xs text-muted-foreground">
														{user.id}
													</div>
												</TableCell>
												<TableCell>{user.email}</TableCell>
												<TableCell>
													<RoleBadge isAdmin={user.isAdmin} />
												</TableCell>
												<TableCell>
													{!user.isAdmin && (
														<Button
															variant="outline"
															size="sm"
															onClick={() => assignAdminRole(user.id)}
															disabled={loading}
															className="h-8"
														>
															Make Admin
														</Button>
													)}
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell colSpan={4} className="py-6 text-center">
												<p className="text-muted-foreground">No users found</p>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function renderSkeletonRows() {
	return Array.from({ length: 5 }).map((_, index) => {
		// Using a stable ID for skeleton rows
		const stableId = `skeleton-${index}-${Math.random().toString(36).substring(2, 9)}`;
		return (
			<TableRow key={stableId}>
				<TableCell>
					<div className="space-y-2">
						<Skeleton className="h-4 w-[120px]" />
						<Skeleton className="h-3 w-[80px]" />
					</div>
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[180px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-5 w-[60px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-8 w-[90px]" />
				</TableCell>
			</TableRow>
		);
	});
}
