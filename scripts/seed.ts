import db from "@/db";
import {
    exerciseCategories,
    exerciseDifficulties,
    levelRequirements,
    muscleGroups,
} from "@/db/schema";

async function main() {
  console.log("Seeding database...");

  try {
    // Seed exercise difficulties
    console.log("Seeding exercise difficulties...");
    await db.insert(exerciseDifficulties).values([
      { id: 1, label: "Beginner" },
      { id: 2, label: "Intermediate" },
      { id: 3, label: "Advanced" },
      { id: 4, label: "Expert" },
    ]);

    // Seed exercise categories
    console.log("Seeding exercise categories...");
    await db.insert(exerciseCategories).values([
      { name: "Strength" },
      { name: "Cardio" },
      { name: "Flexibility" },
      { name: "Balance" },
      { name: "HIIT" },
      { name: "Endurance" },
    ]);

    // Seed muscle groups
    console.log("Seeding muscle groups...");
    await db.insert(muscleGroups).values([
      { name: "Chest" },
      { name: "Back" },
      { name: "Shoulders" },
      { name: "Arms" },
      { name: "Legs" },
      { name: "Core" },
      { name: "Full Body" },
    ]);

    // Seed level requirements
    console.log("Seeding level requirements...");
    const levels = Array.from({ length: 100 }, (_, i) => ({
      level: i + 1,
      pointsRequired: Math.floor(100 * Math.pow(1.5, i)), // Exponential progression
      description: `Level ${i + 1}`,
      rewards: {
        badge: i > 0 && (i + 1) % 5 === 0 ? `Level ${i + 1} Achievement` : null,
        title: i > 0 && (i + 1) % 10 === 0 ? `Level ${i + 1} Master` : null,
      },
    }));

    await db.insert(levelRequirements).values(levels);

    console.log("Seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

main();
