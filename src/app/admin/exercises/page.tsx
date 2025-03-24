import AdminAccessCheck from "@/components/AdminAccessCheck";
import AdminExerciseManagement from "@/components/AdminExerciseManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";

export default function AdminExercisesPage() {
	return (
		<AdminAccessCheck>
			<div className="space-y-6 p-6 lg:px-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Dumbbell className="h-8 w-8 text-primary" />
						<div>
							<h1 className="text-2xl font-semibold">Exercise Management</h1>
							<p className="text-sm text-muted-foreground">
								Manage exercise catalog and categories
							</p>
						</div>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Exercise Management</CardTitle>
						<CardDescription>
							Create and manage exercises, categories, and difficulty levels
						</CardDescription>
					</CardHeader>
					<CardContent>
						<AdminExerciseManagement />
					</CardContent>
				</Card>
			</div>
		</AdminAccessCheck>
	);
}
