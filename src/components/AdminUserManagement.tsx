"use client";

import type React from "react";

import { CheckCircle, Search, Shield, UserCog, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	username: string;
	isAdmin: boolean;
}

type RoleBadgeProps = {
	isAdmin: boolean;
};

export default function AdminUserManagement() {
	const [username, setUsername] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedRole, setSelectedRole] = useState<string>("all");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);

	// Use tRPC to fetch users
	const {
		data: users = [],
		isLoading: isLoadingUsers,
		refetch: refetchUsers,
		error: usersError,
	} = trpc.admin.listUsers.useQuery();

	// Handle user query errors
	useEffect(() => {
		if (usersError) {
			console.error("Error fetching users:", usersError);
			setError("Failed to load users");
		}
	}, [usersError]);

	// Use tRPC mutation for setting admin role
	const setAdminMutation = trpc.admin.setAdminRole.useMutation({
		onSuccess: () => {
			setMessage("Admin role assigned successfully");
			refetchUsers();
			setUsername("");
			setIsDialogOpen(false);
			setSelectedUser(null);
		},
		onError: (err) => {
			// Extract the error message from the TRPCClientError
			let errorMessage = "Failed to assign admin role";

			if (err.message.includes("Username does not exist")) {
				errorMessage = "Username does not exist. Please check the username and try again.";
			} else if (err.message) {
				errorMessage = err.message;
			}

			setError(errorMessage);
			console.error("Error:", err);
		},
	});

	const assignAdminRole = useCallback(
		(username: string) => {
			setMessage("");
			setError("");

			setAdminMutation.mutate({
				username,
				isAdmin: true,
			});
		},
		[setAdminMutation],
	);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUsername(e.target.value);
	};

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const openUserDialog = (user: User) => {
		setSelectedUser(user);
		setIsDialogOpen(true);
	};

	const closeUserDialog = () => {
		setIsDialogOpen(false);
		setSelectedUser(null);
	};

	// Filter users based on search and role selection
	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			searchQuery === "" ||
			`${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()));

		const matchesRole =
			selectedRole === "all" || (selectedRole === "admin" && user.isAdmin) || (selectedRole === "user" && !user.isAdmin);

		return matchesSearch && matchesRole;
	});

	const RoleBadge = ({ isAdmin }: RoleBadgeProps) => {
		return isAdmin ? (
			<Badge className="bg-primary/20 text-primary hover:bg-primary/30 px-2">
				<CheckCircle className="mr-1 h-3 w-3" />
				Admin
			</Badge>
		) : (
			<Badge variant="outline" className="text-muted-foreground">
				User
			</Badge>
		);
	};

	// Get user initials for avatar
	const getUserInitials = (firstName: string, lastName: string) => {
		return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
	};

	const userCount = users.length;
	const adminCount = users.filter((user) => user.isAdmin).length;
	const regularUserCount = userCount - adminCount;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div className="flex items-center gap-2">
							<Shield className="h-5 w-5 text-primary" />
							<div>
								<CardTitle className="text-2xl">User Management</CardTitle>
								<CardDescription>Manage user roles and permissions for the application</CardDescription>
							</div>
						</div>
						<Button onClick={() => setIsDialogOpen(true)}>
							<UserCog className="mr-2 h-4 w-4" />
							Assign Admin Role
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{message && (
						<Alert className="mb-6">
							<CheckCircle className="h-4 w-4" />
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

					<div className="grid gap-6 md:grid-cols-3 mb-6">
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<Users className="mx-auto h-8 w-8 text-primary" />
									<h3 className="mt-2 font-semibold text-xl">{userCount}</h3>
									<p className="text-sm text-muted-foreground">Total Users</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<UserCog className="mx-auto h-8 w-8 text-primary" />
									<h3 className="mt-2 font-semibold text-xl">{adminCount}</h3>
									<p className="text-sm text-muted-foreground">Admin Users</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="text-center">
									<Users className="mx-auto h-8 w-8 text-muted-foreground" />
									<h3 className="mt-2 font-semibold text-xl">{regularUserCount}</h3>
									<p className="text-sm text-muted-foreground">Regular Users</p>
								</div>
							</CardContent>
						</Card>
					</div>

					<Tabs defaultValue="all-users" className="w-full">
						<TabsList className="mb-4">
							<TabsTrigger value="all-users">All Users</TabsTrigger>
							<TabsTrigger value="admins">Admins</TabsTrigger>
							<TabsTrigger value="regular-users">Regular Users</TabsTrigger>
						</TabsList>

						<TabsContent value="all-users">
							<UserTable
								users={users}
								filteredUsers={filteredUsers}
								isLoadingUsers={isLoadingUsers}
								searchQuery={searchQuery}
								setSearchQuery={setSearchQuery}
								handleSearchChange={handleSearchChange}
								selectedRole={selectedRole}
								setSelectedRole={setSelectedRole}
								RoleBadge={RoleBadge}
								getUserInitials={getUserInitials}
								assignAdminRole={assignAdminRole}
								isPending={setAdminMutation.isPending}
								openUserDialog={openUserDialog}
							/>
						</TabsContent>

						<TabsContent value="admins">
							<UserTable
								users={users}
								filteredUsers={filteredUsers.filter((user) => user.isAdmin)}
								isLoadingUsers={isLoadingUsers}
								searchQuery={searchQuery}
								setSearchQuery={setSearchQuery}
								handleSearchChange={handleSearchChange}
								selectedRole="admin"
								setSelectedRole={setSelectedRole}
								RoleBadge={RoleBadge}
								getUserInitials={getUserInitials}
								assignAdminRole={assignAdminRole}
								isPending={setAdminMutation.isPending}
								openUserDialog={openUserDialog}
							/>
						</TabsContent>

						<TabsContent value="regular-users">
							<UserTable
								users={users}
								filteredUsers={filteredUsers.filter((user) => !user.isAdmin)}
								isLoadingUsers={isLoadingUsers}
								searchQuery={searchQuery}
								setSearchQuery={setSearchQuery}
								handleSearchChange={handleSearchChange}
								selectedRole="user"
								setSelectedRole={setSelectedRole}
								RoleBadge={RoleBadge}
								getUserInitials={getUserInitials}
								assignAdminRole={assignAdminRole}
								isPending={setAdminMutation.isPending}
								openUserDialog={openUserDialog}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Assign Admin Role</DialogTitle>
						<DialogDescription>
							{selectedUser
								? `Assign admin privileges to ${selectedUser.firstName} ${selectedUser.lastName}`
								: "Enter the username of the user you want to assign the admin role to."}
						</DialogDescription>
					</DialogHeader>

					{selectedUser ? (
						<div className="space-y-4 py-2">
							<div className="grid grid-cols-4 items-center gap-2">
								<p className="text-sm font-medium">Name:</p>
								<p className="col-span-3">
									{selectedUser.firstName} {selectedUser.lastName}
								</p>
							</div>
							<div className="grid grid-cols-4 items-center gap-2">
								<p className="text-sm font-medium">Username:</p>
								<p className="col-span-3">{selectedUser.username || "N/A"}</p>
							</div>
							<div className="grid grid-cols-4 items-center gap-2">
								<p className="text-sm font-medium">Email:</p>
								<p className="col-span-3">{selectedUser.email}</p>
							</div>
							<div className="grid grid-cols-4 items-center gap-2">
								<p className="text-sm font-medium">Current Role:</p>
								<div className="col-span-3">
									<RoleBadge isAdmin={selectedUser.isAdmin} />
								</div>
							</div>
						</div>
					) : (
						<div className="flex items-center gap-2 py-2">
							<Input
								type="text"
								value={username}
								onChange={handleInputChange}
								placeholder="Enter Username"
								className="flex-1"
							/>
						</div>
					)}

					<DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
						<Button variant="outline" onClick={closeUserDialog}>
							Cancel
						</Button>
						<Button
							onClick={() => assignAdminRole(selectedUser ? selectedUser.username : username)}
							disabled={
								setAdminMutation.isPending || (!selectedUser && !username) || (selectedUser ? selectedUser.isAdmin : false)
							}
						>
							{setAdminMutation.isPending ? "Assigning..." : "Assign Admin Role"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

interface UserTableProps {
	users: User[];
	filteredUsers: User[];
	isLoadingUsers: boolean;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	selectedRole: string;
	setSelectedRole: (role: string) => void;
	RoleBadge: React.FC<RoleBadgeProps>;
	getUserInitials: (firstName: string, lastName: string) => string;
	assignAdminRole: (username: string) => void;
	isPending: boolean;
	openUserDialog: (user: User) => void;
}

function UserTable({
	users,
	filteredUsers,
	isLoadingUsers,
	searchQuery,
	setSearchQuery,
	handleSearchChange,
	selectedRole,
	setSelectedRole,
	RoleBadge,
	getUserInitials,
	assignAdminRole,
	isPending,
	openUserDialog
}: UserTableProps) {
	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row gap-4 justify-between">
				<div className="relative w-full sm:max-w-xs">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search users..."
						className="w-full pl-8"
						value={searchQuery}
						onChange={handleSearchChange}
					/>
					{searchQuery && (
						<Button
							variant="ghost"
							size="sm"
							className="absolute right-0 top-0 h-9 w-9 p-0"
							onClick={() => setSearchQuery("")}
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Clear search</span>
						</Button>
					)}
				</div>
				<Select value={selectedRole} onValueChange={setSelectedRole}>
					<SelectTrigger className="w-full sm:w-[180px]">
						<SelectValue placeholder="Filter by role" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Roles</SelectItem>
						<SelectItem value="admin">Admin</SelectItem>
						<SelectItem value="user">Regular User</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Username</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoadingUsers ? (
							renderSkeletonRows()
						) : filteredUsers.length > 0 ? (
							filteredUsers.map((user) => (
								<TableRow key={user.id} className="group">
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar className="h-8 w-8 rounded-full">
												<AvatarFallback className="bg-muted/50 text-muted-foreground">
													{getUserInitials(user.firstName, user.lastName)}
												</AvatarFallback>
											</Avatar>
											<div>
												<div className="font-medium">
													{user.firstName} {user.lastName}
												</div>
												<div className="mt-1 text-xs text-muted-foreground">
													{user.id}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell>{user.username || "N/A"}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<RoleBadge isAdmin={user.isAdmin} />
									</TableCell>
									<TableCell>
										<div
											className={cn("flex items-center gap-2", "opacity-0 group-hover:opacity-100 transition-opacity")}
										>
											<Button variant="outline" size="sm" onClick={() => openUserDialog(user)} className="h-8">
												View Details
											</Button>
											{!user.isAdmin && user.username && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => assignAdminRole(user.username)}
													disabled={isPending}
													className="h-8"
												>
													Make Admin
												</Button>
											)}
										</div>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={5} className="py-6 text-center">
									<p className="text-muted-foreground">No users found</p>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="text-sm text-muted-foreground">
				Showing {filteredUsers.length} of {users.length} users
			</div>
		</div>
	);
}

function renderSkeletonRows() {
	return Array.from({ length: 5 }).map((_, index) => {
		// Using a stable ID for skeleton rows
		const stableId = `skeleton-${index}-${Math.random().toString(36).substring(2, 9)}`;
		return (
			<TableRow key={stableId}>
				<TableCell>
					<div className="flex items-center gap-3">
						<Skeleton className="h-8 w-8 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-4 w-[120px]" />
							<Skeleton className="h-3 w-[80px]" />
						</div>
					</div>
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[100px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[180px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-5 w-[60px]" />
				</TableCell>
				<TableCell>
					<div className="flex gap-2">
						<Skeleton className="h-8 w-[90px]" />
						<Skeleton className="h-8 w-[90px]" />
					</div>
				</TableCell>
			</TableRow>
		);
	});
}
