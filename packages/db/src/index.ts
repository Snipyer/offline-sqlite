import { Database } from "bun:sqlite";
import { env } from "@offline-sqlite/env/server";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { resolve } from "path";

import * as schema from "./schema";

const dbPath = resolve(process.cwd(), env.DATABASE_URL);
const client = new Database(dbPath);

export const db = drizzle({ client, schema });
