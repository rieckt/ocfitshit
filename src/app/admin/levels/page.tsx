import AdminAccessCheck from "@/components/AdminAccessCheck";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Award, Plus } from "lucide-react";

export default function AdminLevelsPage() {
	return (
		<AdminAccessCheck>
			<div className="space-y-6 p-6 lg:px-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Award className="h-8 w-8 text-primary" />
						<div>
							<h1 className="text-2xl font-semibold">Level System</h1>
							<p className="text-sm text-muted-foreground">
								Configure progression and rewards
							</p>
						</div>
					</div>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Add Level
					</Button>
				</div>

				<div className="grid gap-6">
					{/* Create Level Form */}
					<Card>
						<CardHeader>
							<CardTitle>Create New Level</CardTitle>
							<CardDescription>
								Define a new level in the progression system
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label htmlFor="level" className="text-sm font-medium">
											Level Number
										</label>
										<Input
											id="level"
											type="number"
											min="1"
											placeholder="e.g., 5"
										/>
									</div>
									<div className="space-y-2">
										<label htmlFor="title" className="text-sm font-medium">
											Level Title
										</label>
										<Input
											id="title"
											placeholder="e.g., Elite Athlete"
										/>
									</div>
									<div className="space-y-2">
										<label htmlFor="xpRequired" className="text-sm font-medium">
											XP Required
										</label>
										<Input
											id="xpRequired"
											type="number"
											min="0"
											placeholder="e.g., 1000"
										/>
									</div>
									<div className="space-y-2">
										<label htmlFor="rewards" className="text-sm font-medium">
											Rewards
										</label>
										<Input
											id="rewards"
											placeholder="e.g., Special Badge, Point Multiplier"
										/>
									</div>
								</div>
								<Button className="w-full">Create Level</Button>
							</form>
						</CardContent>
					</Card>

					{/* Level Overview */}
					<Card>
						<CardHeader>
							<CardTitle>Level Overview</CardTitle>
							<CardDescription>
								Current progression system configuration
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-6 md:grid-cols-3">
								<LevelStatCard
									title="Total Levels"
									value="10"
									description="Progression tiers"
								/>
								<LevelStatCard
									title="Max Level"
									value="Elite Master"
									description="Highest achievable rank"
								/>
								<LevelStatCard
									title="Total XP Required"
									value="25,000"
									description="To reach max level"
								/>
							</div>
						</CardContent>
					</Card>

					{/* Level Configuration */}
					<Card>
						<CardHeader>
							<CardTitle>Level Configuration</CardTitle>
							<CardDescription>
								Manage level requirements and rewards
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Level</TableHead>
										<TableHead>Title</TableHead>
										<TableHead>XP Required</TableHead>
										<TableHead>Rewards</TableHead>
										<TableHead>Users at Level</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									<TableRow>
										<TableCell className="font-medium">1</TableCell>
										<TableCell>Beginner</TableCell>
										<TableCell>0</TableCell>
										<TableCell>Welcome Badge</TableCell>
										<TableCell>125</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Button variant="outline" size="sm">
													Edit
												</Button>
												<Button variant="outline" size="sm">
													Delete
												</Button>
											</div>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="font-medium">2</TableCell>
										<TableCell>Enthusiast</TableCell>
										<TableCell>500</TableCell>
										<TableCell>1.1x Points Multiplier</TableCell>
										<TableCell>89</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Button variant="outline" size="sm">
													Edit
												</Button>
												<Button variant="outline" size="sm">
													Delete
												</Button>
											</div>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="font-medium">3</TableCell>
										<TableCell>Athlete</TableCell>
										<TableCell>1,500</TableCell>
										<TableCell>1.2x Points Multiplier</TableCell>
										<TableCell>45</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Button variant="outline" size="sm">
													Edit
												</Button>
												<Button variant="outline" size="sm">
													Delete
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

function LevelStatCard({
	title,
	value,
	description,
}: {
	title: string;
	value: string;
	description: string;
}) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				<p className="text-xs text-muted-foreground">{description}</p>
			</CardContent>
		</Card>
	);
}
