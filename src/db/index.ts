import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is not set");
}

// Create neon client
const sql = neon(process.env.DATABASE_URL);

// Create drizzle client with schema
const db = drizzle(sql, { schema });

export default db;
