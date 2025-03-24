'use client';

import AdminAccessCheck from "@/components/AdminAccessCheck";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronRight, Loader2, Pencil, Plus, Trophy, Users, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

/**
 * Zod schema for season creation validation
 */
const createSeasonSchema = z.object({
    name: z.string().min(1, "Season name is required"),
    startsAt: z.date(),
    endsAt: z.date(),
    isActive: z.boolean().default(true),
});

type CreateSeasonInput = z.infer<typeof createSeasonSchema>;

interface FormErrors {
    name?: string;
    dates?: string;
    active?: string;
}

/**
 * Season data structure from the API
 */
interface Season {
    id: string;
    name: string;
    startsAt: Date;
    endsAt: Date;
    isActive: boolean | null;
    challenges?: {
        id: string;
        name: string;
        startsAt: Date | null;
        endsAt: Date | null;
        pointsMultiplier: number | null;
    }[];
    participants?: number;
    createdAt?: Date | null;
}

/**
 * Props for the SeasonCard component
 */
interface SeasonCardProps {
    season: Season;
    status: 'active' | 'upcoming' | 'past';
}

/**
 * Formats a date safely with error handling
 * @param date - Date to format
 * @param pattern - Date format pattern
 * @returns Formatted date string or "Invalid date" if formatting fails
 */
const formatDateSafe = (date: Date | string, pattern: string = "dd/MM/yyyy"): string => {
    try {
        return format(new Date(date), pattern, { locale: de });
    } catch (error) {
        console.error("Date formatting error:", error);
        return "Invalid date";
    }
};

/**
 * Component for creating a new season
 * Handles form validation and submission
 */
function CreateSeasonForm() {
	const [formData, setFormData] = useState<Partial<CreateSeasonInput>>({
		isActive: true,
	});
	const [errors, setErrors] = useState<FormErrors>({});
	const utils = trpc.useUtils();

	const { mutate: createSeason, isPending } = trpc.admin.createSeason.useMutation({
		onSuccess: (data) => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<CalendarIcon className="h-5 w-5 text-primary" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Season created</p>
						<p className="text-sm text-muted-foreground">{formData.name} has been created</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
			resetForm();
			utils.admin.getSeasons.invalidate();
		},
		onError: (error) => {
			toast(
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
						<XCircle className="h-5 w-5 text-destructive" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-foreground">Failed to create season</p>
						<p className="text-sm text-muted-foreground">{error.message}</p>
					</div>
				</div>,
				{
					className: "bg-background text-foreground border-border",
				}
			);
		},
	});

	/**
	 * Resets the form to its initial state
	 */
	const resetForm = () => {
		setFormData({ isActive: true });
		setErrors({});
	};

	/**
	 * Validates dates whenever they change
	 */
	useEffect(() => {
		validateDates(formData.startsAt, formData.endsAt);
	}, [formData.startsAt, formData.endsAt]);

	/**
	 * Validates the start and end dates
	 */
	const validateDates = (startDate?: Date, endDate?: Date) => {
		if (startDate && endDate) {
			if (startDate >= endDate) {
				setErrors(prev => ({
					...prev,
					dates: "End date must be after start date"
				}));
			} else {
				setErrors(prev => {
					const { dates, ...rest } = prev;
					return rest;
				});
			}
		}
	};

	/**
	 * Handles form submission
	 */
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const validationErrors = validateForm();

		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}

		createSeason({
			name: formData.name!.trim(),
			startsAt: formData.startsAt!,
			endsAt: formData.endsAt!,
			isActive: formData.isActive ?? true,
		});
	};

	/**
	 * Validates the form data
	 */
	const validateForm = (): FormErrors => {
		const newErrors: FormErrors = {};

		if (!formData.name?.trim()) {
			newErrors.name = "Season name is required";
		}

		if (!formData.startsAt || !formData.endsAt) {
			newErrors.dates = "Both start and end dates are required";
		} else {
			const startDate = new Date(formData.startsAt);
			const endDate = new Date(formData.endsAt);

			if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
				newErrors.dates = "Invalid date format";
			} else if (startDate >= endDate) {
				newErrors.dates = "End date must be after start date";
			}
		}

		return newErrors;
	};

	const handleDateChange = (field: 'startsAt' | 'endsAt', value: string) => {
		if (!value) {
			setFormData(prev => ({ ...prev, [field]: undefined }));
			return;
		}

		try {
			const [year, month, day] = value.split('-').map(Number);
			const date = new Date(year, month - 1, day);
			if (!isNaN(date.getTime())) {
				setFormData(prev => ({ ...prev, [field]: date }));
			}
		} catch (error) {
			console.error('Date parsing error:', error);
		}
	};

	const formatDate = (date: Date | undefined): string => {
		if (!date) return '';
		try {
			// Keep yyyy-MM-dd format for input fields as it's the HTML standard
			return format(date, "yyyy-MM-dd");
		} catch (error) {
			console.error('Date formatting error:', error);
			return '';
		}
	};

	const formatDisplayDate = (date: Date | undefined): string => {
		if (!date) return '';
		try {
			return format(date, "dd/MM/yyyy", { locale: de });
		} catch (error) {
			console.error('Date formatting error:', error);
			return '';
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Create New Season</CardTitle>
				<CardDescription>
					Set up a new competition season
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<FormField
							label="Season Name"
							error={errors.name}
							required
						>
							<Input
								id="name"
								placeholder="e.g., Summer 2024"
								value={formData.name || ""}
								onChange={(e) => {
									setFormData(prev => ({ ...prev, name: e.target.value }));
									if (e.target.value.trim()) {
										setErrors(prev => {
											const { name, ...rest } = prev;
											return rest;
										});
									}
								}}
								className={cn(errors.name && "border-destructive")}
							/>
						</FormField>

						<DatePickerField
							label="Start Date"
							selected={formData.startsAt}
							onSelect={(date) => date && setFormData(prev => ({ ...prev, startsAt: date }))}
							error={errors.dates}
						/>

						<DatePickerField
							label="End Date"
							selected={formData.endsAt}
							onSelect={(date) => date && setFormData(prev => ({ ...prev, endsAt: date }))}
							error={errors.dates}
						/>
					</div>

					<Button
						className="w-full"
						type="submit"
						disabled={isPending || Object.keys(errors).length > 0}
					>
						{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Create Season
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

interface FormFieldProps {
	label: string;
	error?: string;
	required?: boolean;
	children: React.ReactNode;
}

/**
 * Reusable form field component
 */
function FormField({ label, error, required, children }: FormFieldProps) {
	return (
		<div className="space-y-2">
			<Label className={cn(error && "text-destructive")}>
				{label}
				{required && <span className="text-destructive"> *</span>}
			</Label>
			{children}
			{error && <p className="text-xs text-destructive mt-1">{error}</p>}
		</div>
	);
}

interface DatePickerFieldProps {
	label: string;
	selected?: Date;
	onSelect: (date: Date | undefined) => void;
	error?: string;
}

/**
 * Reusable date picker field component
 */
function DatePickerField({ label, selected, onSelect, error }: DatePickerFieldProps) {
	return (
		<FormField label={label} error={error}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"w-full justify-start text-left font-normal",
							!selected && "text-muted-foreground",
							error && "border-destructive"
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{selected ? (
							formatDateSafe(selected)
						) : (
							<span>Pick a date</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={selected}
						onSelect={onSelect}
						initialFocus
						locale={de}
					/>
				</PopoverContent>
			</Popover>
		</FormField>
	);
}

/**
 * Component for editing a season
 */
function EditSeasonModal({ season, isOpen, onClose }: { season: Season; isOpen: boolean; onClose: () => void }) {
	const [formData, setFormData] = useState({
		name: season.name,
		startsAt: new Date(season.startsAt),
		endsAt: new Date(season.endsAt),
	});
	const [errors, setErrors] = useState<FormErrors>({});
	const utils = trpc.useUtils();

	const { mutate: updateSeason, isPending: isUpdating } = trpc.season.update.useMutation({
		onSuccess: () => {
			toast.success("Season updated successfully");
			utils.admin.getSeasons.invalidate();
			onClose();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const { mutate: deleteSeason, isPending: isDeleting } = trpc.season.delete.useMutation({
		onSuccess: () => {
			toast.success("Season deleted successfully");
			utils.admin.getSeasons.invalidate();
			onClose();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const validateDates = (startDate: Date, endDate: Date): boolean => {
		if (startDate >= endDate) {
			setErrors(prev => ({
				...prev,
				dates: "End date must be after start date"
			}));
			return false;
		}
		setErrors(prev => {
			const { dates, ...rest } = prev;
			return rest;
		});
		return true;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name?.trim()) {
			setErrors(prev => ({ ...prev, name: "Season name is required" }));
			return;
		}

		if (!validateDates(formData.startsAt, formData.endsAt)) {
			return;
		}

		updateSeason({
			id: season.id,
			name: formData.name.trim(),
			startsAt: formData.startsAt,
			endsAt: formData.endsAt,
		});
	};

	const handleDelete = () => {
		if (window.confirm("Are you sure you want to delete this season? This action cannot be undone.")) {
			deleteSeason({ id: season.id });
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[700px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<CalendarIcon className="h-5 w-5 text-primary" />
						Edit Season
					</DialogTitle>
					<DialogDescription className="text-base">
						Make changes to your season configuration here. Click save when you're done.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-6">
					<div className="space-y-2">
						<Label htmlFor="name" className="text-base font-medium">
							Season Name
						</Label>
						<Input
							id="name"
							placeholder="e.g., Summer 2024"
							value={formData.name}
							onChange={(e) => {
								setFormData(prev => ({ ...prev, name: e.target.value }));
								if (e.target.value.trim()) {
									setErrors(prev => {
										const { name, ...rest } = prev;
										return rest;
									});
								}
							}}
							className={cn(
								"text-base transition-all",
								errors.name ? "border-destructive ring-destructive" : "hover:border-primary/50 focus:border-primary"
							)}
						/>
						{errors.name && (
							<p className="text-sm text-destructive flex items-center gap-1">
								<XCircle className="h-4 w-4" />
								{errors.name}
							</p>
						)}
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label className="text-base font-medium">Season Duration</Label>
							{errors.dates && (
								<p className="text-sm text-destructive flex items-center gap-1">
									<XCircle className="h-4 w-4" />
									{errors.dates}
								</p>
							)}
						</div>
						<div className="grid gap-6 sm:grid-cols-2">
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="text-sm text-muted-foreground">Start Date</Label>
									<span className="text-sm font-medium">
										{format(formData.startsAt, "PPP", { locale: de })}
									</span>
								</div>
								<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
									<Calendar
										mode="single"
										selected={formData.startsAt}
										onSelect={(date) => {
											if (date) {
												const newDate = new Date(date);
												newDate.setHours(0, 0, 0, 0);
												setFormData(prev => ({ ...prev, startsAt: newDate }));
												validateDates(newDate, formData.endsAt);
											}
										}}
										disabled={(date) => date > formData.endsAt}
										initialFocus
										className="rounded-md"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="text-sm text-muted-foreground">End Date</Label>
									<span className="text-sm font-medium">
										{format(formData.endsAt, "PPP", { locale: de })}
									</span>
								</div>
								<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
									<Calendar
										mode="single"
										selected={formData.endsAt}
										onSelect={(date) => {
											if (date) {
												const newDate = new Date(date);
												newDate.setHours(23, 59, 59, 999);
												setFormData(prev => ({ ...prev, endsAt: newDate }));
												validateDates(formData.startsAt, newDate);
											}
										}}
										disabled={(date) => date < formData.startsAt}
										initialFocus
										className="rounded-md"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="border-t pt-4">
					<div className="flex w-full items-center justify-between gap-4">
						<Button
							type="button"
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
							className="gap-2"
						>
							{isDeleting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<XCircle className="h-4 w-4" />
							)}
							Delete Season
						</Button>
						<div className="flex gap-2">
							<Button
								variant="outline"
								type="button"
								onClick={onClose}
								className="min-w-[100px]"
							>
								Cancel
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={isUpdating || Object.keys(errors).length > 0}
								className="min-w-[100px] gap-2"
							>
								{isUpdating ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<CalendarIcon className="h-4 w-4" />
								)}
								Save
							</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Card component for displaying a season
 */
const SeasonCard = ({ season, status }: SeasonCardProps) => {
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const router = useRouter();

	const handleViewDetails = () => {
		router.push(`/admin/seasons/${season.id}`);
	};

	return (
		<Card className="group hover:shadow-md transition-all">
			<CardContent className="pt-6">
				<div className="flex items-start justify-between">
					<div>
						<h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
							{season.name}
						</h3>
						<p className="text-sm text-muted-foreground mt-1">
							{formatDateSafe(season.startsAt)} - {formatDateSafe(season.endsAt)}
						</p>
					</div>
					<div className={cn(
						"rounded-full px-2 py-1 text-xs font-medium",
						status === 'active' && "bg-green-50 text-green-700 ring-1 ring-green-600/20",
						status === 'upcoming' && "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20",
						status === 'past' && "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20"
					)}>
						{status === 'active' && 'Active'}
						{status === 'upcoming' && 'Upcoming'}
						{status === 'past' && 'Completed'}
					</div>
				</div>

				<div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
					<div className="flex items-center gap-1">
						<Trophy className="h-4 w-4" />
						<span>{season.challenges?.length || 0} Challenges</span>
					</div>
					<div className="flex items-center gap-1">
						<Users className="h-4 w-4" />
						<span>{season.participants || 0} Participants</span>
					</div>
				</div>

				<div className="mt-4 flex items-center justify-between">
					<Button
						variant="ghost"
						size="sm"
						className="text-primary hover:text-primary"
						onClick={handleViewDetails}
					>
						View Details
						<ChevronRight className="ml-2 h-4 w-4" />
					</Button>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsEditModalOpen(true)}
							className="flex items-center gap-2"
						>
							<Pencil className="h-4 w-4" />
							Edit
						</Button>
					</div>
				</div>
			</CardContent>
			{isEditModalOpen && (
				<EditSeasonModal
					season={season}
					isOpen={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
				/>
			)}
		</Card>
	);
};

/**
 * Component for displaying the list of seasons
 * Categorizes seasons into active, upcoming, and past
 */
function SeasonsList() {
	const { data: seasons, isLoading } = trpc.admin.getSeasons.useQuery();
	const now = new Date();

	if (isLoading) {
		return <LoadingState />;
	}

	if (!seasons || seasons.length === 0) {
		return <EmptyState />;
	}

	const categorizeSeasons = (seasons: Season[]) => {
		const active: Season[] = [];
		const upcoming: Season[] = [];
		const past: Season[] = [];

		seasons.forEach(season => {
			try {
				const startDate = new Date(season.startsAt);
				const endDate = new Date(season.endsAt);
				const isActive = season.isActive ?? false; // Default to false if null

				if (isActive && isBefore(startDate, now) && isAfter(endDate, now)) {
					active.push(season);
				} else if (isActive && isAfter(startDate, now)) {
					upcoming.push(season);
				} else {
					past.push(season);
				}
			} catch (error) {
				console.error("Error categorizing season:", error);
			}
		});

		return { active, upcoming, past };
	};

	const { active: activeSeasons, upcoming: upcomingSeasons, past: pastSeasons } = categorizeSeasons(seasons);

	return (
		<div className="space-y-8">
			<SeasonSection
				title="Active Seasons"
				seasons={activeSeasons}
				status="active"
				badgeColor="green"
			/>
			<SeasonSection
				title="Upcoming Seasons"
				seasons={upcomingSeasons}
				status="upcoming"
				badgeColor="yellow"
			/>
			<SeasonSection
				title="Past Seasons"
				seasons={pastSeasons}
				status="past"
				badgeColor="gray"
			/>
		</div>
	);
}

/**
 * Props for the SeasonSection component
 */
interface SeasonSectionProps {
	title: string;
	seasons: Season[];
	status: 'active' | 'upcoming' | 'past';
	badgeColor: 'green' | 'yellow' | 'gray';
}

/**
 * Component for displaying a section of seasons with a title and badge
 */
function SeasonSection({ title, seasons, status, badgeColor }: SeasonSectionProps) {
	if (seasons.length === 0) return null;

	return (
		<div>
			<div className="flex items-center gap-2 mb-4">
				<h2 className="text-lg font-semibold">{title}</h2>
				<span className={cn(
					"rounded-full px-2 py-0.5 text-xs font-medium",
					badgeColor === 'green' && "bg-green-50 text-green-700",
					badgeColor === 'yellow' && "bg-yellow-50 text-yellow-700",
					badgeColor === 'gray' && "bg-gray-50 text-gray-700"
				)}>
					{seasons.length}
				</span>
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{seasons.map((season) => (
					<SeasonCard key={season.id} season={season} status={status} />
				))}
			</div>
		</div>
	);
}

/**
 * Component for displaying an empty state when no seasons exist
 */
function EmptyState() {
	return (
		<Card>
			<CardContent className="flex flex-col items-center justify-center py-12">
				<div className="rounded-full bg-primary/10 p-4">
					<CalendarIcon className="h-8 w-8 text-primary" />
				</div>
				<h3 className="mt-4 text-lg font-semibold">No Seasons Yet</h3>
				<p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
					Create your first season to start organizing competitions and tracking progress.
				</p>
				<Button className="mt-4" onClick={() => document.getElementById('seasonName')?.focus()}>
					<Plus className="mr-2 h-4 w-4" />
					Create First Season
				</Button>
			</CardContent>
		</Card>
	);
}

/**
 * Component for displaying a loading state with skeletons
 */
function LoadingState() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-7 w-40" />
				<Skeleton className="h-4 w-64" />
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="flex items-center gap-4">
							<Skeleton className="h-12 flex-1" />
							<Skeleton className="h-12 w-32" />
							<Skeleton className="h-12 w-24" />
							<Skeleton className="h-12 w-32" />
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Main page component for managing seasons
 */
export default function AdminSeasonsPage() {
	return (
		<AdminAccessCheck>
			<div className="space-y-6 p-6 lg:px-8">
				<PageHeader />
				<div className="grid gap-6">
					<CreateSeasonForm />
					<SeasonsList />
				</div>
			</div>
		</AdminAccessCheck>
	);
}

/**
 * Component for displaying the page header
 */
function PageHeader() {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-2">
				<CalendarIcon className="h-8 w-8 text-primary" />
				<div>
					<h1 className="text-2xl font-semibold">Season Management</h1>
					<p className="text-sm text-muted-foreground">
						Create and manage competition seasons
					</p>
				</div>
			</div>
		</div>
	);
}
