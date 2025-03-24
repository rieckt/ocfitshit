import AdminAccessCheck from "@/components/AdminAccessCheck";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Trophy } from "lucide-react";

export default function AdminChallengesPage() {
	return (
		<AdminAccessCheck>
			<div className="space-y-6 p-6 lg:px-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Trophy className="h-8 w-8 text-primary" />
						<div>
							<h1 className="text-2xl font-semibold">Challenge Management</h1>
							<p className="text-sm text-muted-foreground">
								Create and manage fitness challenges
							</p>
						</div>
					</div>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Create Challenge
					</Button>
				</div>

				<div className="grid gap-6">
					{/* Create Challenge Form */}
					<Card>
						<CardHeader>
							<CardTitle>Create New Challenge</CardTitle>
							<CardDescription>
								Set up a new fitness challenge
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<label htmlFor="name" className="text-sm font-medium">
											Challenge Name
										</label>
										<Input
											id="name"
											placeholder="e.g., 30 Days of Strength"
										/>
									</div>
									<div className="space-y-2">
										<label htmlFor="season" className="text-sm font-medium">
											Season
										</label>
										<Select>
											<SelectTrigger>
												<SelectValue placeholder="Select season" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="spring2024">Spring 2024</SelectItem>
												<SelectItem value="summer2024">Summer 2024</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<label htmlFor="startDate" className="text-sm font-medium">
											Start Date
										</label>
										<Input
											id="startDate"
											type="date"
										/>
									</div>
									<div className="space-y-2">
										<label htmlFor="endDate" className="text-sm font-medium">
											End Date
										</label>
										<Input
											id="endDate"
											type="date"
										/>
									</div>
									<div className="space-y-2">
										<label htmlFor="description" className="text-sm font-medium">
											Description
										</label>
										<Input
											id="description"
											placeholder="Challenge description..."
										/>
									</div>
									<div className="space-y-2">
										<label htmlFor="pointsMultiplier" className="text-sm font-medium">
											Points Multiplier
										</label>
										<Input
											id="pointsMultiplier"
											type="number"
											min="1"
											defaultValue="1"
										/>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox id="isTeamBased" />
									<label
										htmlFor="isTeamBased"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Team-based Challenge
									</label>
								</div>
								<Button className="w-full">Create Challenge</Button>
							</form>
						</CardContent>
					</Card>

					{/* Active Challenges */}
					<Card>
						<CardHeader>
							<CardTitle>Active Challenges</CardTitle>
							<CardDescription>
								Currently running challenges
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Season</TableHead>
										<TableHead>Period</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Participants</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									<TableRow>
										<TableCell>Spring Strength Challenge</TableCell>
										<TableCell>Spring 2024</TableCell>
										<TableCell>Mar 15 - Apr 15</TableCell>
										<TableCell>
											<span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
												Team
											</span>
										</TableCell>
										<TableCell>48</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Button variant="outline" size="sm">
													View Details
												</Button>
												<Button variant="outline" size="sm">
													End Challenge
												</Button>
											</div>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>30 Days of Cardio</TableCell>
										<TableCell>Spring 2024</TableCell>
										<TableCell>Apr 1 - Apr 30</TableCell>
										<TableCell>
											<span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
												Individual
											</span>
										</TableCell>
										<TableCell>156</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Button variant="outline" size="sm">
													View Details
												</Button>
												<Button variant="outline" size="sm">
													End Challenge
												</Button>
											</div>
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* Past Challenges */}
					<Card>
						<CardHeader>
							<CardTitle>Past Challenges</CardTitle>
							<CardDescription>
								Completed challenges and their results
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Season</TableHead>
										<TableHead>Period</TableHead>
										<TableHead>Winner</TableHead>
										<TableHead>Participants</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									<TableRow>
										<TableCell>Winter Warrior Challenge</TableCell>
										<TableCell>Winter 2023</TableCell>
										<TableCell>Dec 1 - Dec 31</TableCell>
										<TableCell>Team Alpha</TableCell>
										<TableCell>124</TableCell>
										<TableCell>
											<Button variant="outline" size="sm">
												View Details
											</Button>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Holiday Hustle</TableCell>
										<TableCell>Winter 2023</TableCell>
										<TableCell>Dec 15 - Jan 15</TableCell>
										<TableCell>John Doe</TableCell>
										<TableCell>89</TableCell>
										<TableCell>
											<Button variant="outline" size="sm">
												View Details
											</Button>
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
