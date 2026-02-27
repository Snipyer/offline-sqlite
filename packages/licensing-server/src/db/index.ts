import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const DB_PATH = process.env.LICENSE_DB_PATH ?? "license.db";

const sqlite = new Database(DB_PATH);
sqlite.run("PRAGMA journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Auto-create tables on first run (simple approach for a small admin DB)
sqlite.run(`
  CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    plan TEXT NOT NULL,
    key_payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT,
    max_transfers INTEGER DEFAULT 3,
    is_revoked INTEGER DEFAULT 0
  )
`);

sqlite.run(`
  CREATE TABLE IF NOT EXISTS activations (
    id TEXT PRIMARY KEY,
    license_id TEXT NOT NULL REFERENCES licenses(id),
    fingerprint TEXT NOT NULL,
    fingerprint_signals TEXT,
    activated_at TEXT NOT NULL,
    deactivated_at TEXT,
    app_version TEXT,
    os TEXT,
    is_active INTEGER DEFAULT 1
  )
`);

sqlite.run(`
  CREATE TABLE IF NOT EXISTS trial_records (
    fingerprint TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )
`);
