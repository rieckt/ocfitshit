import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

async function main() {
  try {
    // Create neon client with type assertion since we've checked it's not undefined
    const sql = neon(databaseUrl as string);
    // Create drizzle instance with neon client
    const db = drizzle(sql);

    console.log("Running migrations...");

    const start = Date.now();
    await migrate(db, { migrationsFolder: "drizzle" });
    const end = Date.now();

    console.log(`✅ Migrations completed in ${end - start}ms`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed!");
    console.error(error);
    process.exit(1);
  }
}

main();
