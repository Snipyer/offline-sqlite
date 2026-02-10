import { Database } from "bun:sqlite";
import { env } from "@offline-sqlite/env/server";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate as drizzleMigrate } from "drizzle-orm/bun-sqlite/migrator";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import * as schema from "./schema";

const dbPath = resolve(process.cwd(), env.DATABASE_URL);
const client = new Database(dbPath);

export const db = drizzle({ client, schema });

/**
 * Run database migrations
 * @param migrationsFolder - Path to migrations folder (default: package migrations folder)
 */
export async function runMigrations(migrationsFolder?: string): Promise<void> {
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const defaultMigrationsFolder = resolve(__dirname, "./migrations");

	console.log("Running migrations from:", migrationsFolder || defaultMigrationsFolder);
	await drizzleMigrate(db, {
		migrationsFolder: migrationsFolder || defaultMigrationsFolder,
	});
	console.log("Migrations completed");
}
