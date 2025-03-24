'use client';

import AdminAccessCheck from "@/components/AdminAccessCheck";
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
import { cn } from "@/lib/utils";
import { TRPCClientError } from "@trpc/client";
import { BarChart, Dumbbell, Loader2, Plus, Target, Trash2, XCircle } from "lucide-react";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

// Define the exercise schema
const exerciseSchema = z.object({
    name: z.string().min(1, "Exercise name is required"),
    description: z.string().min(1, "Description is required"),
    equipment: z.string().min(1, "Equipment information is required"),
    difficultyId: z.number().int().positive("Difficulty level is required"),
    categoryIds: z.array(z.number().int().positive()).min(1, "At least one category is required"),
    muscleGroupIds: z.array(z.number().int().positive()).min(1, "At least one muscle group is required"),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

// Improved error handling helper for tRPC errors
const getErrorMessage = (error: unknown) => {
    if (error instanceof TRPCClientError) {
        // Handle specific error codes
        switch (error.data?.code) {
            case "PRECONDITION_FAILED":
                return {
                    title: "Operation Failed",
                    message: error.message,
                    variant: "warning" as const,
                };
            case "CONFLICT":
                return {
                    title: "Duplicate Entry",
                    message: error.message,
                    variant: "warning" as const,
                };
            case "BAD_REQUEST":
                return {
                    title: "Invalid Data",
                    message: error.message,
                    variant: "warning" as const,
                };
            case "NOT_FOUND":
                return {
                    title: "Not Found",
                    message: error.message,
                    variant: "warning" as const,
                };
            case "UNAUTHORIZED":
                return {
                    title: "Unauthorized",
                    message: "You don't have permission to perform this action.",
                    variant: "destructive" as const,
                };
            case "FORBIDDEN":
                return {
                    title: "Access Denied",
                    message: "You don't have permission to perform this action.",
                    variant: "destructive" as const,
                };
            default:
                return {
                    title: "Error",
                    message: error.message || "An unexpected error occurred",
                    variant: "destructive" as const,
                };
        }
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => err.message).join(", ");
        return {
            title: "Validation Error",
            message: errors,
            variant: "warning" as const,
        };
    }

    // Handle other types of errors
    return {
        title: "Error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive" as const,
    };
};

// Improved error toast helper
const showErrorToast = (error: unknown) => {
    const { title, message, variant } = getErrorMessage(error);
    toast(
        <div className="flex items-center gap-3">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", {
                "bg-destructive/10": variant === "destructive",
                "bg-warning/10": variant === "warning",
            })}>
                <XCircle className={cn("h-5 w-5", {
                    "text-destructive": variant === "destructive",
                    "text-warning": variant === "warning",
                })} />
            </div>
            <div className="flex-1">
                <p className="font-medium text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>,
        {
            className: "bg-background text-foreground border-border",
        }
    );
};

/**
 * Loading state component for the exercises page
 */
function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
					<div className="space-y-2">
						<div className="h-6 w-48 animate-pulse rounded bg-muted" />
						<div className="h-4 w-64 animate-pulse rounded bg-muted" />
					</div>
				</div>
			</div>
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<div className="h-6 w-48 animate-pulse rounded bg-muted" />
						<div className="h-4 w-72 animate-pulse rounded bg-muted" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="h-10 animate-pulse rounded bg-muted" />
							))}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<div className="h-6 w-48 animate-pulse rounded bg-muted" />
						<div className="h-4 w-72 animate-pulse rounded bg-muted" />
					</CardHeader>
					<CardContent>
						<div className="h-[400px] animate-pulse rounded bg-muted" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

/**
 * Page header component with title and description
 */
function PageHeader() {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Dumbbell className="h-6 w-6 text-primary" />
				</div>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Exercise Management</h1>
					<p className="text-sm text-muted-foreground">
						Create and manage exercises, categories, and difficulty levels
					</p>
				</div>
			</div>
		</div>
	);
}

interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}

/**
 * Reusable form field component
 */
function FormField({ label, error, required, children, className }: FormFieldProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label className={cn(error && "text-destructive")}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>
            {children}
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
}

/**
 * Main content component that uses tRPC hooks
 */
function ExerciseManagementContent() {
	// Exercise form state
	const [formData, setFormData] = useState<ExerciseFormData>({
		name: "",
		description: "",
		equipment: "",
		difficultyId: 0,
		categoryIds: [],
		muscleGroupIds: [],
	});
	const [formErrors, setFormErrors] = useState<Partial<Record<keyof ExerciseFormData, string>>>({});

	// Additional form states
	const [newDifficulty, setNewDifficulty] = useState("");
	const [newCategory, setNewCategory] = useState("");
	const [newMuscleGroup, setNewMuscleGroup] = useState("");

	// Queries
	const { data: exercises, isLoading } = trpc.admin.getExercises.useQuery();
	const { data: difficulties } = trpc.admin.getDifficulties.useQuery();
	const { data: categories } = trpc.admin.getCategories.useQuery();
	const { data: muscleGroups } = trpc.admin.getMuscleGroups.useQuery();
	const utils = trpc.useUtils();

	// Exercise mutations
	const createExercise = trpc.admin.createExercise.useMutation({
		onSuccess: () => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Plus className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Exercise Created</p>
						<p className="text-sm text-muted-foreground">Exercise has been added successfully</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
			setFormData({
				name: "",
				description: "",
				equipment: "",
				difficultyId: 0,
				categoryIds: [],
				muscleGroupIds: [],
			});
			setFormErrors({});
			void utils.admin.getExercises.invalidate();
		},
		onError: showErrorToast,
	});

	const deleteExercise = trpc.admin.deleteExercise.useMutation({
		onSuccess: () => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Trash2 className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Exercise Deleted</p>
						<p className="text-sm text-muted-foreground">Exercise has been removed successfully</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
			void utils.admin.getExercises.invalidate();
		},
		onError: showErrorToast,
	});

	// Difficulty mutations
	const createDifficulty = trpc.admin.createDifficulty.useMutation({
		onSuccess: () => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Plus className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Difficulty Created</p>
						<p className="text-sm text-muted-foreground">New difficulty level has been added</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
			setNewDifficulty("");
			void utils.admin.getDifficulties.invalidate();
		},
		onError: showErrorToast,
	});

	const deleteDifficulty = trpc.admin.deleteDifficulty.useMutation({
		onSuccess: () => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Trash2 className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Difficulty Deleted</p>
						<p className="text-sm text-muted-foreground">Difficulty level has been removed</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
			void utils.admin.getDifficulties.invalidate();
		},
		onError: showErrorToast,
	});

	// Category mutations
	const createCategory = trpc.admin.createCategory.useMutation({
		onSuccess: () => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Plus className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Category Created</p>
						<p className="text-sm text-muted-foreground">New category has been added</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
			setNewCategory("");
			void utils.admin.getCategories.invalidate();
		},
		onError: showErrorToast,
	});

	const deleteCategory = trpc.admin.deleteCategory.useMutation({
		onSuccess: () => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Trash2 className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Category Deleted</p>
						<p className="text-sm text-muted-foreground">Category has been removed</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
			void utils.admin.getCategories.invalidate();
		},
		onError: showErrorToast,
	});

	// Muscle group mutations
	const createMuscleGroup = trpc.admin.createMuscleGroup.useMutation({
		onSuccess: () => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Plus className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Muscle Group Created</p>
						<p className="text-sm text-muted-foreground">New muscle group has been added</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
			setNewMuscleGroup("");
			void utils.admin.getMuscleGroups.invalidate();
		},
		onError: showErrorToast,
	});

	const deleteMuscleGroup = trpc.admin.deleteMuscleGroup.useMutation({
		onSuccess: () => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Trash2 className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Muscle Group Deleted</p>
						<p className="text-sm text-muted-foreground">Muscle group has been removed</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
			void utils.admin.getMuscleGroups.invalidate();
		},
		onError: showErrorToast,
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
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
		setFormData((prev) => ({
			...prev,
			categoryIds: prev.categoryIds.includes(categoryId)
				? prev.categoryIds.filter((id) => id !== categoryId)
				: [...prev.categoryIds, categoryId],
		}));
	};

	const handleMuscleGroupToggle = (muscleGroupId: number) => {
		setFormData((prev) => ({
			...prev,
			muscleGroupIds: prev.muscleGroupIds.includes(muscleGroupId)
				? prev.muscleGroupIds.filter((id) => id !== muscleGroupId)
				: [...prev.muscleGroupIds, muscleGroupId],
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			// Only validate the form when submitting
			const validatedData = exerciseSchema.safeParse(formData);

			if (!validatedData.success) {
				const errors: Partial<Record<keyof ExerciseFormData, string>> = {};
				validatedData.error.errors.forEach((err) => {
					const path = err.path.join(".");
					errors[path as keyof ExerciseFormData] = err.message;
				});
				setFormErrors(errors);
				toast.error("Please fix the form errors before submitting");
				return;
			}

			await createExercise.mutateAsync(validatedData.data);
		} catch (error) {
			console.error("Error creating exercise:", error);
			showErrorToast(error);
		}
	};

	// Add new handlers for difficulties, categories, and muscle groups
	const handleCreateDifficulty = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newDifficulty) return;
		createDifficulty.mutate({ label: newDifficulty });
	};

	const handleCreateCategory = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCategory) return;
		createCategory.mutate({ name: newCategory });
	};

	const handleCreateMuscleGroup = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMuscleGroup) return;
		createMuscleGroup.mutate({ name: newMuscleGroup });
	};

	if (isLoading) {
		return <LoadingState />;
	}

	return (
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
				<TabsTrigger value="categories" className="flex items-center gap-2">
					<Target className="h-4 w-4" rotate={90} />
					Categories
				</TabsTrigger>
				<TabsTrigger value="muscleGroups" className="flex items-center gap-2">
					<Target className="h-4 w-4" />
					Muscle Groups
				</TabsTrigger>
			</TabsList>

			{/* Exercises Tab */}
			<TabsContent value="exercises">
				<div className="grid gap-6 md:grid-cols-2">
					{/* Exercise Creation Form */}
					<Card>
						<CardHeader>
							<CardTitle>Add New Exercise</CardTitle>
							<CardDescription>Create a new exercise type</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										label="Exercise Name"
										error={formErrors.name}
										required
									>
										<Input
											id="name"
											name="name"
											placeholder="e.g., Push-ups"
											value={formData.name || ""}
											onChange={handleInputChange}
											className={cn(formErrors.name && "border-destructive")}
										/>
									</FormField>

									<FormField
										label="Description"
										error={formErrors.description}
										required
									>
										<Input
											id="description"
											name="description"
											placeholder="Brief description of the exercise"
											value={formData.description || ""}
											onChange={handleInputChange}
											className={cn(formErrors.description && "border-destructive")}
										/>
									</FormField>

									<FormField
										label="Equipment"
										error={formErrors.equipment}
										required
									>
										<Input
											id="equipment"
											name="equipment"
											placeholder="Required equipment"
											value={formData.equipment || ""}
											onChange={handleInputChange}
											className={cn(formErrors.equipment && "border-destructive")}
										/>
									</FormField>

									<FormField
										label="Difficulty Level"
										error={formErrors.difficultyId}
										required
									>
										<Select
											value={formData.difficultyId?.toString()}
											onValueChange={handleDifficultyChange}
										>
											<SelectTrigger className={cn(formErrors.difficultyId && "border-destructive")}>
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
									</FormField>

									<FormField
										label="Categories"
										error={formErrors.categoryIds}
										required
										className="col-span-2"
									>
										<div className="flex flex-wrap gap-2">
											{categories?.map((category) => (
												<div
													key={category.id}
													className={cn(
														"flex items-center space-x-2 rounded-md border p-2",
														formData.categoryIds?.includes(category.id) && "border-primary bg-primary/5"
													)}
												>
													<Checkbox
														id={`category-${category.id}`}
														checked={formData.categoryIds?.includes(category.id)}
														onCheckedChange={() => handleCategoryToggle(category.id)}
													/>
													<label
														htmlFor={`category-${category.id}`}
														className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
													>
														{category.name}
													</label>
												</div>
											))}
										</div>
									</FormField>

									<FormField
										label="Muscle Groups"
										error={formErrors.muscleGroupIds}
										required
										className="col-span-2"
									>
										<div className="flex flex-wrap gap-2">
											{muscleGroups?.map((muscleGroup) => (
												<div
													key={muscleGroup.id}
													className={cn(
														"flex items-center space-x-2 rounded-md border p-2",
														formData.muscleGroupIds?.includes(muscleGroup.id) && "border-primary bg-primary/5"
													)}
												>
													<Checkbox
														id={`muscle-${muscleGroup.id}`}
														checked={formData.muscleGroupIds?.includes(muscleGroup.id)}
														onCheckedChange={() => handleMuscleGroupToggle(muscleGroup.id)}
													/>
													<label
														htmlFor={`muscle-${muscleGroup.id}`}
														className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
													>
														{muscleGroup.name}
													</label>
												</div>
											))}
										</div>
									</FormField>
								</div>

								<Button
									type="submit"
									disabled={createExercise.isPending}
									className="w-full"
								>
									{createExercise.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Create Exercise
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* Exercise List */}
					<Card>
						<CardHeader>
							<CardTitle>Exercise List</CardTitle>
							<CardDescription>Manage existing exercises</CardDescription>
						</CardHeader>
						<CardContent>
							<ExerciseList />
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			{/* Difficulties Tab */}
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
							<form onSubmit={handleCreateDifficulty} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="difficultyLabel">Label</Label>
									<Input
										id="difficultyLabel"
										value={newDifficulty}
										onChange={(e) => setNewDifficulty(e.target.value)}
										placeholder="e.g., Beginner, Intermediate, Advanced"
									/>
								</div>
								<Button type="submit" className="w-full" disabled={createDifficulty.isPending}>
									{createDifficulty.isPending ? "Adding..." : "Add Difficulty Level"}
								</Button>
							</form>
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
										{difficulties?.length === 0 ? (
											<TableRow>
												<TableCell colSpan={2} className="text-center">
													No difficulties found
												</TableCell>
											</TableRow>
										) : (
											difficulties?.map((difficulty) => (
												<TableRow key={difficulty.id}>
													<TableCell>{difficulty.label}</TableCell>
													<TableCell>
														<AlertDialog>
															<AlertDialogTrigger asChild>
																<Button
																	variant="destructive"
																	size="icon"
																	disabled={deleteDifficulty.isPending}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Delete Difficulty Level
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Are you sure you want to delete {difficulty.label}? This action cannot be undone.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Cancel</AlertDialogCancel>
																	<Button
																		variant="destructive"
																		onClick={() => deleteDifficulty.mutate({ id: difficulty.id })}
																		disabled={deleteDifficulty.isPending}
																	>
																		{deleteDifficulty.isPending ? "Deleting..." : "Delete"}
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

			{/* Categories Tab */}
			<TabsContent value="categories">
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Add Category</CardTitle>
							<CardDescription>
								Create a new exercise category
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleCreateCategory} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="categoryName">Name</Label>
									<Input
										id="categoryName"
										value={newCategory}
										onChange={(e) => setNewCategory(e.target.value)}
										placeholder="e.g., Strength, Cardio, Flexibility"
									/>
								</div>
								<Button type="submit" className="w-full" disabled={createCategory.isPending}>
									{createCategory.isPending ? "Adding..." : "Add Category"}
								</Button>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Categories</CardTitle>
							<CardDescription>
								Manage exercise categories
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
										{categories?.length === 0 ? (
											<TableRow>
												<TableCell colSpan={2} className="text-center">
													No categories found
												</TableCell>
											</TableRow>
										) : (
											categories?.map((category) => (
												<TableRow key={category.id}>
													<TableCell>{category.name}</TableCell>
													<TableCell>
														<AlertDialog>
															<AlertDialogTrigger asChild>
																<Button
																	variant="destructive"
																	size="icon"
																	disabled={deleteCategory.isPending}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Delete Category
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Are you sure you want to delete {category.name}? This action cannot be undone.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Cancel</AlertDialogCancel>
																	<Button
																		variant="destructive"
																		onClick={() => deleteCategory.mutate({ id: category.id })}
																		disabled={deleteCategory.isPending}
																	>
																		{deleteCategory.isPending ? "Deleting..." : "Delete"}
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

			{/* Muscle Groups Tab */}
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
							<form onSubmit={handleCreateMuscleGroup} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="muscleGroupName">Name</Label>
									<Input
										id="muscleGroupName"
										value={newMuscleGroup}
										onChange={(e) => setNewMuscleGroup(e.target.value)}
										placeholder="e.g., Chest, Back, Legs"
									/>
								</div>
								<Button type="submit" className="w-full" disabled={createMuscleGroup.isPending}>
									{createMuscleGroup.isPending ? "Adding..." : "Add Muscle Group"}
								</Button>
							</form>
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
										{muscleGroups?.length === 0 ? (
											<TableRow>
												<TableCell colSpan={2} className="text-center">
													No muscle groups found
												</TableCell>
											</TableRow>
										) : (
											muscleGroups?.map((muscleGroup) => (
												<TableRow key={muscleGroup.id}>
													<TableCell>{muscleGroup.name}</TableCell>
													<TableCell>
														<AlertDialog>
															<AlertDialogTrigger asChild>
																<Button
																	variant="destructive"
																	size="icon"
																	disabled={deleteMuscleGroup.isPending}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Delete Muscle Group
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Are you sure you want to delete {muscleGroup.name}? This action cannot be undone.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Cancel</AlertDialogCancel>
																	<Button
																		variant="destructive"
																		onClick={() => deleteMuscleGroup.mutate({ id: muscleGroup.id })}
																		disabled={deleteMuscleGroup.isPending}
																	>
																		{deleteMuscleGroup.isPending ? "Deleting..." : "Delete"}
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
		</Tabs>
	);
}

/**
 * Exercise list component
 */
function ExerciseList() {
	const { data: exercises, isLoading } = trpc.admin.getExercises.useQuery();
	const utils = trpc.useUtils();

	const deleteExercise = trpc.admin.deleteExercise.useMutation({
		onSuccess: () => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Trash2 className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Exercise Deleted</p>
						<p className="text-sm text-muted-foreground">Exercise has been removed successfully</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
			void utils.admin.getExercises.invalidate();
		},
		onError: (error) => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
						<XCircle className="h-5 w-5 text-destructive" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Failed to delete exercise</p>
						<p className="text-sm text-muted-foreground">{error.message}</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
		},
	});

	if (isLoading) {
		return <LoadingState />;
	}

	if (!exercises || exercises.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<div className="rounded-full bg-primary/10 p-4">
						<Dumbbell className="h-8 w-8 text-primary" />
					</div>
					<h3 className="mt-4 text-lg font-semibold">No Exercises Yet</h3>
					<p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
						Create your first exercise to start building your catalog.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Exercise Catalog</CardTitle>
				<CardDescription>
					Manage your exercise catalog
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Equipment</TableHead>
							<TableHead>Difficulty</TableHead>
							<TableHead>Categories</TableHead>
							<TableHead>Muscle Groups</TableHead>
							<TableHead className="w-[100px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{exercises.map((exercise) => (
							<TableRow key={exercise.id}>
								<TableCell className="font-medium">{exercise.name}</TableCell>
								<TableCell>{exercise.description}</TableCell>
								<TableCell>{exercise.equipment}</TableCell>
								<TableCell>
									<Badge variant="secondary">
										{exercise.difficulty?.label}
									</Badge>
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{exercise.categories.map(({ category }) => (
											<Badge key={category.id} variant="outline">
												{category.name}
											</Badge>
										))}
									</div>
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{exercise.muscleGroups.map(({ muscleGroup }) => (
											<Badge key={muscleGroup.id} variant="outline" className="bg-primary/5">
												{muscleGroup.name}
											</Badge>
										))}
									</div>
								</TableCell>
								<TableCell>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="ghost" size="icon" className="hover:text-destructive">
												<Trash2 className="h-4 w-4" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Delete Exercise</AlertDialogTitle>
												<AlertDialogDescription>
													Are you sure you want to delete this exercise? This action cannot be undone.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<Button
													variant="destructive"
													onClick={() => deleteExercise.mutate({ id: exercise.id })}
												>
													Delete
												</Button>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

/**
 * Main exercises admin page component
 */
export default function AdminExercisesPage() {
	return (
		<AdminAccessCheck>
			<div className="space-y-6 p-6 lg:px-8">
				<PageHeader />
				<Suspense fallback={<LoadingState />}>
					<ExerciseManagementContent />
				</Suspense>
			</div>
		</AdminAccessCheck>
	);
}
