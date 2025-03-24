"use client";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import type { AppRouter } from "@/lib/trpc/root";
import type { inferRouterOutputs } from "@trpc/server";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type RouterOutput = inferRouterOutputs<AppRouter>;
type ExerciseType = RouterOutput["admin"]["getExerciseTypes"][number];

export default function AdminExerciseManagement() {
  const [exerciseName, setExerciseName] = useState("");
  const [unit, setUnit] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Get all exercise types
  const { data: exerciseTypes, refetch: refetchExerciseTypes } = trpc.admin.getExerciseTypes.useQuery(undefined, {
    retry: 0,
  });

  // Create exercise type mutation
  const createExercise = trpc.admin.createExerciseType.useMutation({
    onSuccess: () => {
      toast.success("Exercise type created successfully");
      // Reset form
      setExerciseName("");
      setUnit("");
      // Refetch exercise types
      void refetchExerciseTypes();
    },
    onError: (error) => {
      toast.error(`Failed to create exercise type: ${error.message}`);
    },
  });

  // Delete exercise type mutation
  const deleteExercise = trpc.admin.deleteExerciseType.useMutation({
    onMutate: () => {
      setIsDeleting(true);
    },
    onSuccess: () => {
      toast.success("Exercise type deleted successfully");
      void refetchExerciseTypes();
    },
    onError: (error) => {
      toast.error(`Failed to delete exercise type: ${error.message}`);
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExercise.mutateAsync({
        name: exerciseName,
        unit,
      });
    } catch (error) {
      // Error is handled by the mutation callbacks
      console.error("Error creating exercise type:", error);
    }
  };

  const handleDelete = async (type: ExerciseType) => {
    try {
      await deleteExercise.mutateAsync({ id: Number(type.id) });
    } catch (error) {
      // Error is handled by the mutation callbacks
      console.error("Error deleting exercise type:", error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Exercise Management</CardTitle>
          <CardDescription>Add and manage exercises for the fitness competition</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exerciseName">Exercise Name</Label>
              <Input
                id="exerciseName"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="e.g., Push-ups"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., reps, minutes, kilometers"
                required
              />
            </div>
            <Button type="submit" disabled={createExercise.isPending}>
              {createExercise.isPending ? "Creating..." : "Add Exercise"}
            </Button>
          </form>

          {exerciseTypes && exerciseTypes.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Existing Exercise Types</h3>
              <div className="space-y-2">
                {exerciseTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{type.name}</p>
                      <p className="text-sm text-muted-foreground">Unit: {type.unit}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Exercise Type</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {type.name}? This will also delete all exercises of this type. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button
                            variant="destructive"
                            onClick={() => void handleDelete(type)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
