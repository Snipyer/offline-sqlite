import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

dotenv.config({
	path: "../../apps/server/.env",
});

const dbPath = resolve("../../apps/server", process.env.DATABASE_URL || "local.db");

export default defineConfig({
	schema: "./src/schema",
	out: "./src/migrations",
	dialect: "sqlite",
	dbCredentials: {
		url: dbPath,
	},
});
