import AdminAccessCheck from "@/components/AdminAccessCheck";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Users } from "lucide-react";

export default function AdminTeamsPage() {
	return (
		<AdminAccessCheck>
			<div className="space-y-6 p-6 lg:px-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Users className="h-8 w-8 text-primary" />
						<div>
							<h1 className="text-2xl font-semibold">Team Management</h1>
							<p className="text-sm text-muted-foreground">
								Create and manage competition teams
							</p>
						</div>
					</div>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Create Team
					</Button>
				</div>

				<div className="grid gap-6">
					{/* Create Team Form */}
					<Card>
						<CardHeader>
							<CardTitle>Create New Team</CardTitle>
							<CardDescription>
								Set up a new competition team
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label htmlFor="name" className="text-sm font-medium">
											Team Name
										</label>
										<Input
											id="name"
											placeholder="e.g., The Champions"
										/>
									</div>
									<div className="space-y-2">
										<label htmlFor="captain" className="text-sm font-medium">
											Team Captain
										</label>
										<Select>
											<SelectTrigger>
												<SelectValue placeholder="Select team captain" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="user1">John Doe</SelectItem>
												<SelectItem value="user2">Jane Smith</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<label htmlFor="description" className="text-sm font-medium">
											Description
										</label>
										<Input
											id="description"
											placeholder="Brief team description"
										/>
									</div>
									<div className="space-y-2">
										<label htmlFor="maxMembers" className="text-sm font-medium">
											Maximum Members
										</label>
										<Input
											id="maxMembers"
											type="number"
											min="2"
											defaultValue="5"
										/>
									</div>
								</div>
								<Button className="w-full">Create Team</Button>
							</form>
						</CardContent>
					</Card>

					{/* Active Teams */}
					<Card>
						<CardHeader>
							<CardTitle>Active Teams</CardTitle>
							<CardDescription>
								Currently active competition teams
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								<TeamCard
									name="Team Alpha"
									captain="John Doe"
									members={5}
									level={8}
									points={2450}
									rank={1}
								/>
								<TeamCard
									name="Fitness Warriors"
									captain="Jane Smith"
									members={4}
									level={7}
									points={2100}
									rank={2}
								/>
								<TeamCard
									name="Power Squad"
									captain="Mike Johnson"
									members={3}
									level={6}
									points={1850}
									rank={3}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Team Rankings */}
					<Card>
						<CardHeader>
							<CardTitle>Team Rankings</CardTitle>
							<CardDescription>
								Current season team standings
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Rank</TableHead>
										<TableHead>Team</TableHead>
										<TableHead>Captain</TableHead>
										<TableHead>Members</TableHead>
										<TableHead>Level</TableHead>
										<TableHead>Points</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									<TableRow>
										<TableCell className="font-medium">1</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Avatar className="h-8 w-8">
													<AvatarFallback>TA</AvatarFallback>
												</Avatar>
												Team Alpha
											</div>
										</TableCell>
										<TableCell>John Doe</TableCell>
										<TableCell>5/5</TableCell>
										<TableCell>8</TableCell>
										<TableCell>2,450</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Button variant="outline" size="sm">
													View Details
												</Button>
												<Button variant="outline" size="sm">
													Manage Members
												</Button>
											</div>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="font-medium">2</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Avatar className="h-8 w-8">
													<AvatarFallback>FW</AvatarFallback>
												</Avatar>
												Fitness Warriors
											</div>
										</TableCell>
										<TableCell>Jane Smith</TableCell>
										<TableCell>4/5</TableCell>
										<TableCell>7</TableCell>
										<TableCell>2,100</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Button variant="outline" size="sm">
													View Details
												</Button>
												<Button variant="outline" size="sm">
													Manage Members
												</Button>
											</div>
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>
			</div>
		</AdminAccessCheck>
	);
}

function TeamCard({
	name,
	captain,
	members,
	level,
	points,
	rank,
}: {
	name: string;
	captain: string;
	members: number;
	level: number;
	points: number;
	rank: number;
}) {
	return (
		<Card>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Avatar className="h-10 w-10">
							<AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
						</Avatar>
						<div>
							<CardTitle className="text-lg">{name}</CardTitle>
							<CardDescription>Captain: {captain}</CardDescription>
						</div>
					</div>
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
						#{rank}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-3 gap-4 text-center">
					<div>
						<p className="text-sm font-medium text-muted-foreground">Members</p>
						<p className="text-lg font-semibold">{members}/5</p>
					</div>
					<div>
						<p className="text-sm font-medium text-muted-foreground">Level</p>
						<p className="text-lg font-semibold">{level}</p>
					</div>
					<div>
						<p className="text-sm font-medium text-muted-foreground">Points</p>
						<p className="text-lg font-semibold">{points}</p>
					</div>
				</div>
				<div className="mt-4 flex gap-2">
					<Button variant="outline" size="sm" className="w-full">
						View Details
					</Button>
					<Button variant="outline" size="sm" className="w-full">
						Manage
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
