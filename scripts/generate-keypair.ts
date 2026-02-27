/**
 * Generate an Ed25519 keypair for license signing.
 *
 * Usage:
 *   bun run scripts/generate-keypair.ts
 *
 * Outputs:
 *   - apps/web/src-tauri/keys/license_pub.key   (32 bytes, committed)
 *   - keys/license_priv.key                      (32 bytes, NEVER commit)
 */
import { ed25519 } from "@noble/curves/ed25519.js";
import { randomBytes } from "@noble/hashes/utils.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

// Private key goes to project-root/keys/ (git-ignored)
const privDir = resolve(root, "keys");
mkdirSync(privDir, { recursive: true });

// Public key goes into the Tauri binary
const pubDir = resolve(root, "apps/web/src-tauri/keys");
mkdirSync(pubDir, { recursive: true });

const privKey = randomBytes(32);
const pubKey = ed25519.getPublicKey(privKey);

writeFileSync(resolve(privDir, "license_priv.key"), Buffer.from(privKey));
writeFileSync(resolve(pubDir, "license_pub.key"), Buffer.from(pubKey));

console.log("✓ Ed25519 keypair generated");
console.log(`  Private key: keys/license_priv.key  (${privKey.length} bytes) — DO NOT COMMIT`);
console.log(`  Public  key: apps/web/src-tauri/keys/license_pub.key  (${pubKey.length} bytes)`);
