/**
 * Generate a signed license key.
 *
 * Usage:
 *   bun run scripts/generate-license.ts --email dr@clinic.com --plan perpetual
 *   bun run scripts/generate-license.ts --email dr@clinic.com --plan subscription --expires 2027-02-25
 *
 * Requires: keys/license_priv.key (run generate-keypair.ts first)
 */
import { ed25519 } from "@noble/curves/ed25519.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── helpers ──────────────────────────────────────────────
function base64url(buf: Uint8Array): string {
	return Buffer.from(buf).toString("base64url");
}

function randomId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(4));
	return "lic_" + Buffer.from(bytes).toString("hex");
}

// ── parse CLI args ───────────────────────────────────────
function parseArgs() {
	const args = process.argv.slice(2);
	const map = new Map<string, string>();
	for (let i = 0; i < args.length; i += 2) {
		const key = args[i];
		const value = args[i + 1];
		if (key && value) map.set(key.replace(/^--/, ""), value);
	}

	const email = map.get("email");
	const plan = map.get("plan") as "perpetual" | "subscription" | undefined;
	const expires = map.get("expires"); // ISO date string
	const seats = Number(map.get("seats") ?? 1);
	const maxTransfers = Number(map.get("max-transfers") ?? 3);
	const features = (map.get("features") ?? "all").split(",");

	if (!email || !plan) {
		console.error(
			"Usage: bun run scripts/generate-license.ts --email <email> --plan <perpetual|subscription> [--expires YYYY-MM-DD] [--seats N] [--max-transfers N] [--features feat1,feat2]",
		);
		process.exit(1);
	}

	return { email, plan, expires, seats, maxTransfers, features };
}

// ── main ─────────────────────────────────────────────────
const { email, plan, expires, seats, maxTransfers, features } = parseArgs();

const privKeyPath = resolve(import.meta.dirname, "..", "keys", "license_priv.key");
let privKey: Uint8Array;
try {
	privKey = new Uint8Array(readFileSync(privKeyPath));
} catch {
	console.error("Private key not found. Run generate-keypair.ts first.");
	process.exit(1);
}

const payload = {
	id: randomId(),
	email,
	plan,
	seats,
	created_at: new Date().toISOString(),
	expires_at: plan === "subscription" && expires ? new Date(expires).toISOString() : null,
	features,
	max_transfers: maxTransfers,
};

const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
const signature = ed25519.sign(payloadBytes, privKey);

const licenseKey = `LKEY-${base64url(payloadBytes)}.${base64url(signature)}`;

console.log("\n✓ License key generated\n");
console.log("Payload:");
console.log(JSON.stringify(payload, null, 2));
console.log("\nLicense Key:");
console.log(licenseKey);
