import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import type { AppBindings } from "../types";

const DB_BOOTSTRAP_STATEMENTS = [
	`CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    plan TEXT NOT NULL,
    key_payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT,
    max_transfers INTEGER DEFAULT 3,
    is_revoked INTEGER DEFAULT 0
  )`,
	`CREATE TABLE IF NOT EXISTS activations (
    id TEXT PRIMARY KEY,
    license_id TEXT NOT NULL REFERENCES licenses(id),
    fingerprint TEXT NOT NULL,
    fingerprint_signals TEXT,
    activated_at TEXT NOT NULL,
    deactivated_at TEXT,
    app_version TEXT,
    os TEXT,
    is_active INTEGER DEFAULT 1
  )`,
	`CREATE TABLE IF NOT EXISTS trial_records (
    fingerprint TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`,
	`CREATE TABLE IF NOT EXISTS admin_audit_log (
    id TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    details TEXT,
    performed_at TEXT NOT NULL
  )`,
];

let initialized = false;
let initializePromise: Promise<void> | null = null;

function assertDatabaseBinding(env: AppBindings): D1Database {
	if (!env.LICENSE_DB) {
		throw new Error(
			"Missing LICENSE_DB binding. Set a real d1 database_id in wrangler.admin.toml / wrangler.public.toml.",
		);
	}

	return env.LICENSE_DB;
}

export function getDb(env: AppBindings) {
	return drizzle(assertDatabaseBinding(env), { schema });
}

export async function ensureDatabase(env: AppBindings) {
	const database = assertDatabaseBinding(env);

	if (initialized) return;
	if (!initializePromise) {
		initializePromise = (async () => {
			for (const statement of DB_BOOTSTRAP_STATEMENTS) {
				await database.prepare(statement).run();
			}

			initialized = true;
		})();
	}
	await initializePromise;
}
