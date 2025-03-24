"use client";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { BarChart, Calendar, Dumbbell, Settings, Target, Trash2, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

// Define the exercise schema
const exerciseSchema = z.object({
	name: z.string().min(1, "Exercise name is required"),
	description: z.string().optional(),
	equipment: z.string().optional(),
	difficultyId: z.number().int().positive("Difficulty level is required"),
	categoryIds: z.array(z.number().int().positive()),
	muscleGroupIds: z.array(z.number().int().positive()),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

export default function AdminExerciseManagement() {
	const [formData, setFormData] = useState<ExerciseFormData>({
		name: "",
		description: "",
		equipment: "",
		difficultyId: 1,
		categoryIds: [],
		muscleGroupIds: [],
	});
	const [formErrors, setFormErrors] = useState<Partial<Record<keyof ExerciseFormData, string>>>({});

	// Get all exercises and related data
	const { data: exercises, refetch: refetchExercises } = trpc.admin.getExercises.useQuery();
	const { data: difficulties } = trpc.admin.getDifficulties.useQuery();
	const { data: categories } = trpc.admin.getCategories.useQuery();
	const { data: muscleGroups } = trpc.admin.getMuscleGroups.useQuery();

	// Create exercise mutation
	const createExercise = trpc.admin.createExercise.useMutation({
		onSuccess: () => {
			toast.success("Exercise created successfully");
			// Reset form
			setFormData({
				name: "",
				description: "",
				equipment: "",
				difficultyId: 1,
				categoryIds: [],
				muscleGroupIds: [],
			});
			setFormErrors({});
			// Refetch exercises
			void refetchExercises();
		},
		onError: (error) => {
			toast.error(`Failed to create exercise: ${error.message}`);
		},
	});

	// Delete exercise mutation
	const deleteExercise = trpc.admin.deleteExercise.useMutation({
		onSuccess: () => {
			toast.success("Exercise deleted successfully");
			void refetchExercises();
		},
		onError: (error) => {
			toast.error(`Failed to delete exercise: ${error.message}`);
		},
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		// Clear error when user starts typing
		if (formErrors[name as keyof ExerciseFormData]) {
			setFormErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	const handleDifficultyChange = (value: string) => {
		const difficultyId = parseInt(value);
		setFormData((prev) => ({ ...prev, difficultyId }));
		if (formErrors.difficultyId) {
			setFormErrors((prev) => ({ ...prev, difficultyId: undefined }));
		}
	};

	const handleCategoryToggle = (categoryId: number) => {
		setFormData((prev) => {
			const categoryIds = prev.categoryIds.includes(categoryId)
				? prev.categoryIds.filter((id) => id !== categoryId)
				: [...prev.categoryIds, categoryId];
			return { ...prev, categoryIds };
		});
	};

	const handleMuscleGroupToggle = (muscleGroupId: number) => {
		setFormData((prev) => {
			const muscleGroupIds = prev.muscleGroupIds.includes(muscleGroupId)
				? prev.muscleGroupIds.filter((id) => id !== muscleGroupId)
				: [...prev.muscleGroupIds, muscleGroupId];
			return { ...prev, muscleGroupIds };
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			// Validate form data
			const validatedData = exerciseSchema.parse(formData);
			await createExercise.mutateAsync(validatedData);
		} catch (error) {
			if (error instanceof z.ZodError) {
				// Convert Zod errors to a more usable format
				const errors: Partial<Record<keyof ExerciseFormData, string>> = {};
				error.errors.forEach((err) => {
					const path = err.path.join(".");
					errors[path as keyof ExerciseFormData] = err.message;
				});
				setFormErrors(errors);
				toast.error("Please fix the form errors");
			} else {
				console.error("Error creating exercise:", error);
			}
		}
	};

	return (
		<div className="mx-auto py-6">
			<Card>
				<CardHeader>
					<CardTitle>Admin Dashboard</CardTitle>
					<CardDescription>
						Manage all aspects of the fitness competition
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="exercises" className="w-full">
						<TabsList className="mb-4 flex flex-wrap gap-2">
							<TabsTrigger value="exercises" className="flex items-center gap-2">
								<Dumbbell className="h-4 w-4" />
								Exercises
							</TabsTrigger>
							<TabsTrigger value="difficulties" className="flex items-center gap-2">
								<BarChart className="h-4 w-4" />
								Difficulties
							</TabsTrigger>
							<TabsTrigger value="muscleGroups" className="flex items-center gap-2">
								<Target className="h-4 w-4" />
								Muscle Groups
							</TabsTrigger>
							<TabsTrigger value="seasons" className="flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								Seasons
							</TabsTrigger>
							<TabsTrigger value="challenges" className="flex items-center gap-2">
								<Trophy className="h-4 w-4" />
								Challenges
							</TabsTrigger>
							<TabsTrigger value="teams" className="flex items-center gap-2">
								<Users className="h-4 w-4" />
								Teams
							</TabsTrigger>
							<TabsTrigger value="levels" className="flex items-center gap-2">
								<Settings className="h-4 w-4" />
								Level System
							</TabsTrigger>
						</TabsList>

						{/* Exercise Management Tab */}
						<TabsContent value="exercises">
							<div className="grid gap-6 md:grid-cols-2">
								{/* Exercise Creation Form */}
								<Card>
									<CardHeader>
										<CardTitle>Add New Exercise</CardTitle>
										<CardDescription>
											Create a new exercise type
										</CardDescription>
									</CardHeader>
									<CardContent>
										<form onSubmit={handleSubmit} className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="name">Exercise Name</Label>
												<Input
													id="name"
													name="name"
													value={formData.name}
													onChange={handleInputChange}
													placeholder="e.g., Push-ups"
													required
													className={formErrors.name ? "border-red-500" : ""}
												/>
												{formErrors.name && (
													<p className="text-sm text-red-500">
														{formErrors.name}
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="description">Description</Label>
												<Input
													id="description"
													name="description"
													value={formData.description || ""}
													onChange={handleInputChange}
													placeholder="Describe the exercise..."
													className={formErrors.description ? "border-red-500" : ""}
												/>
												{formErrors.description && (
													<p className="text-sm text-red-500">
														{formErrors.description}
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="equipment">Equipment</Label>
												<Input
													id="equipment"
													name="equipment"
													value={formData.equipment || ""}
													onChange={handleInputChange}
													placeholder="Required equipment"
													className={formErrors.equipment ? "border-red-500" : ""}
												/>
												{formErrors.equipment && (
													<p className="text-sm text-red-500">
														{formErrors.equipment}
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label htmlFor="difficulty">Difficulty Level</Label>
												<Select
													value={formData.difficultyId.toString()}
													onValueChange={handleDifficultyChange}
												>
													<SelectTrigger
														className={formErrors.difficultyId ? "border-red-500" : ""}
													>
														<SelectValue placeholder="Select difficulty" />
													</SelectTrigger>
													<SelectContent>
														{difficulties?.map((difficulty) => (
															<SelectItem
																key={difficulty.id}
																value={difficulty.id.toString()}
															>
																{difficulty.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{formErrors.difficultyId && (
													<p className="text-sm text-red-500">
														{formErrors.difficultyId}
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label>Categories</Label>
												<div className="grid grid-cols-2 gap-2">
													{categories?.map((category) => (
														<div
															key={category.id}
															className="flex items-center space-x-2"
														>
															<Checkbox
																id={`category-${category.id}`}
																checked={formData.categoryIds.includes(
																	category.id
																)}
																onCheckedChange={() =>
																	handleCategoryToggle(category.id)
																}
															/>
															<Label
																htmlFor={`category-${category.id}`}
																className="text-sm font-normal"
															>
																{category.name}
															</Label>
														</div>
													))}
												</div>
												{formErrors.categoryIds && (
													<p className="text-sm text-red-500">
														{formErrors.categoryIds}
													</p>
												)}
											</div>
											<div className="space-y-2">
												<Label>Muscle Groups</Label>
												<div className="grid grid-cols-2 gap-2">
													{muscleGroups?.map((muscleGroup) => (
														<div
															key={muscleGroup.id}
															className="flex items-center space-x-2"
														>
															<Checkbox
																id={`muscle-${muscleGroup.id}`}
																checked={formData.muscleGroupIds.includes(
																	muscleGroup.id
																)}
																onCheckedChange={() =>
																	handleMuscleGroupToggle(muscleGroup.id)
																}
															/>
															<Label
																htmlFor={`muscle-${muscleGroup.id}`}
																className="text-sm font-normal"
															>
																{muscleGroup.name}
															</Label>
														</div>
													))}
												</div>
												{formErrors.muscleGroupIds && (
													<p className="text-sm text-red-500">
														{formErrors.muscleGroupIds}
													</p>
												)}
											</div>
											<Button
												type="submit"
												disabled={createExercise.isPending}
												className="w-full"
											>
												{createExercise.isPending
													? "Creating..."
													: "Create Exercise"}
											</Button>
										</form>
									</CardContent>
								</Card>

								{/* Exercise List */}
								<Card>
									<CardHeader>
										<CardTitle>Exercise List</CardTitle>
										<CardDescription>
											Manage existing exercises
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="rounded-md border">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Name</TableHead>
														<TableHead>Description</TableHead>
														<TableHead>Equipment</TableHead>
														<TableHead>Difficulty</TableHead>
														<TableHead className="w-[100px]">Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{exercises?.length === 0 ? (
														<TableRow>
															<TableCell
																colSpan={5}
																className="text-center"
															>
																No exercises found
															</TableCell>
														</TableRow>
													) : (
														exercises?.map((exercise) => (
															<TableRow key={exercise.id}>
																<TableCell>{exercise.name}</TableCell>
																<TableCell>
																	{exercise.description || "N/A"}
																</TableCell>
																<TableCell>
																	{exercise.equipment || "N/A"}
																</TableCell>
																<TableCell>
																	{exercise.difficulty ? (
																		<Badge variant="secondary">
																			{exercise.difficulty.label}
																		</Badge>
																	) : (
																		"N/A"
																	)}
																</TableCell>
																<TableCell>
																	<AlertDialog>
																		<AlertDialogTrigger asChild>
																			<Button
																				variant="destructive"
																				size="icon"
																			>
																				<Trash2 className="h-4 w-4" />
																			</Button>
																		</AlertDialogTrigger>
																		<AlertDialogContent>
																			<AlertDialogHeader>
																				<AlertDialogTitle>
																					Delete Exercise
																				</AlertDialogTitle>
																				<AlertDialogDescription>
																					Are you sure you want to delete{" "}
																					{exercise.name}? This action
																					cannot be undone.
																				</AlertDialogDescription>
																			</AlertDialogHeader>
																			<AlertDialogFooter>
																				<AlertDialogCancel>
																					Cancel
																				</AlertDialogCancel>
																				<Button
																					variant="destructive"
																					onClick={() =>
																						deleteExercise.mutate({
																							id: exercise.id,
																						})
																					}
																				>
																					Delete
																				</Button>
																			</AlertDialogFooter>
																		</AlertDialogContent>
																	</AlertDialog>
																</TableCell>
															</TableRow>
														))
													)}
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						{/* Difficulties Management Tab */}
						<TabsContent value="difficulties">
							<div className="grid gap-6 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Add Difficulty Level</CardTitle>
										<CardDescription>
											Create a new exercise difficulty level
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="difficultyLabel">Label</Label>
												<Input
													id="difficultyLabel"
													placeholder="e.g., Beginner, Intermediate, Advanced"
												/>
											</div>
											<Button className="w-full">
												Add Difficulty Level
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Difficulty Levels</CardTitle>
										<CardDescription>
											Manage exercise difficulty levels
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="rounded-md border">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Label</TableHead>
														<TableHead className="w-[100px]">Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													<TableRow>
														<TableCell>No difficulties yet</TableCell>
														<TableCell></TableCell>
													</TableRow>
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						{/* Muscle Groups Management Tab */}
						<TabsContent value="muscleGroups">
							<div className="grid gap-6 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Add Muscle Group</CardTitle>
										<CardDescription>
											Create a new muscle group
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="muscleGroupName">Name</Label>
												<Input
													id="muscleGroupName"
													placeholder="e.g., Chest, Back, Legs"
												/>
											</div>
											<Button className="w-full">
												Add Muscle Group
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Muscle Groups</CardTitle>
										<CardDescription>
											Manage muscle groups
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="rounded-md border">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Name</TableHead>
														<TableHead className="w-[100px]">Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													<TableRow>
														<TableCell>No muscle groups yet</TableCell>
														<TableCell></TableCell>
													</TableRow>
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						{/* Seasons Management Tab */}
						<TabsContent value="seasons">
							<div className="grid gap-6 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Create Season</CardTitle>
										<CardDescription>
											Start a new competition season
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="seasonName">Season Name</Label>
												<Input
													id="seasonName"
													placeholder="e.g., Summer 2024"
												/>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="startDate">Start Date</Label>
													<Input
														id="startDate"
														type="date"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="endDate">End Date</Label>
													<Input
														id="endDate"
														type="date"
													/>
												</div>
											</div>
											<Button className="w-full">
												Create Season
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Active Seasons</CardTitle>
										<CardDescription>
											Manage competition seasons
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="rounded-md border">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Name</TableHead>
														<TableHead>Period</TableHead>
														<TableHead>Status</TableHead>
														<TableHead className="w-[100px]">Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													<TableRow>
														<TableCell>No seasons yet</TableCell>
														<TableCell></TableCell>
														<TableCell></TableCell>
														<TableCell></TableCell>
													</TableRow>
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						{/* Challenges Management Tab */}
						<TabsContent value="challenges">
							<div className="grid gap-6 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Create Challenge</CardTitle>
										<CardDescription>
											Create a new competition challenge
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="challengeName">Challenge Name</Label>
												<Input
													id="challengeName"
													placeholder="e.g., 30 Days of Strength"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="season">Season</Label>
												<Select>
													<SelectTrigger>
														<SelectValue placeholder="Select season" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="placeholder">
															No seasons available
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="challengeStart">Start Date</Label>
													<Input
														id="challengeStart"
														type="date"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="challengeEnd">End Date</Label>
													<Input
														id="challengeEnd"
														type="date"
													/>
												</div>
											</div>
											<div className="space-y-2">
												<Label htmlFor="description">Description</Label>
												<Input
													id="description"
													placeholder="Challenge description..."
												/>
											</div>
											<div className="flex items-center space-x-2">
												<Checkbox id="isTeamBased" />
												<Label htmlFor="isTeamBased">Team-based Challenge</Label>
											</div>
											<div className="space-y-2">
												<Label htmlFor="pointsMultiplier">Points Multiplier</Label>
												<Input
													id="pointsMultiplier"
													type="number"
													min="1"
													defaultValue="1"
												/>
											</div>
											<Button className="w-full">
												Create Challenge
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Active Challenges</CardTitle>
										<CardDescription>
											Manage competition challenges
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="rounded-md border">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Name</TableHead>
														<TableHead>Season</TableHead>
														<TableHead>Period</TableHead>
														<TableHead>Type</TableHead>
														<TableHead className="w-[100px]">Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													<TableRow>
														<TableCell>No challenges yet</TableCell>
														<TableCell></TableCell>
														<TableCell></TableCell>
														<TableCell></TableCell>
														<TableCell></TableCell>
													</TableRow>
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						{/* Level System Management Tab */}
						<TabsContent value="levels">
							<div className="grid gap-6 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Add Level Requirement</CardTitle>
										<CardDescription>
											Define requirements for each level
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor="level">Level</Label>
													<Input
														id="level"
														type="number"
														min="1"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="pointsRequired">Points Required</Label>
													<Input
														id="pointsRequired"
														type="number"
														min="0"
													/>
												</div>
											</div>
											<div className="space-y-2">
												<Label htmlFor="levelDescription">Description</Label>
												<Input
													id="levelDescription"
													placeholder="Level description..."
												/>
											</div>
											<Button className="w-full">
												Add Level Requirement
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Level Requirements</CardTitle>
										<CardDescription>
											Manage level progression system
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="rounded-md border">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Level</TableHead>
														<TableHead>Points Required</TableHead>
														<TableHead>Description</TableHead>
														<TableHead className="w-[100px]">Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													<TableRow>
														<TableCell>No levels defined</TableCell>
														<TableCell></TableCell>
														<TableCell></TableCell>
														<TableCell></TableCell>
													</TableRow>
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						{/* Teams Management Tab */}
						<TabsContent value="teams">
							<div className="grid gap-6 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Create Team</CardTitle>
										<CardDescription>
											Create a new competition team
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="teamName">Team Name</Label>
												<Input
													id="teamName"
													placeholder="e.g., The Champions"
												/>
											</div>
											<Button className="w-full">
												Create Team
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Active Teams</CardTitle>
										<CardDescription>
											Manage competition teams
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="rounded-md border">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Name</TableHead>
														<TableHead>Members</TableHead>
														<TableHead>Level</TableHead>
														<TableHead>Points</TableHead>
														<TableHead className="w-[100px]">Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													<TableRow>
														<TableCell>No teams yet</TableCell>
														<TableCell></TableCell>
														<TableCell></TableCell>
														<TableCell></TableCell>
														<TableCell></TableCell>
													</TableRow>
												</TableBody>
											</Table>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
