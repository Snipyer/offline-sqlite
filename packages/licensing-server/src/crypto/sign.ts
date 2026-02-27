import { ed25519 } from "@noble/curves/ed25519.js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_PRIV_KEY_PATH = resolve(import.meta.dirname, "../../../../keys/license_priv.key");

const PRIV_KEY_PATH = process.env.LICENSE_PRIV_KEY_PATH ?? DEFAULT_PRIV_KEY_PATH;

let cachedPrivKey: Uint8Array | null = null;

function getPrivateKey(): Uint8Array {
	if (!cachedPrivKey) {
		if (!existsSync(PRIV_KEY_PATH)) {
			throw new Error(`Private key file not found at: ${PRIV_KEY_PATH}`);
		}
		cachedPrivKey = new Uint8Array(readFileSync(PRIV_KEY_PATH));
	}
	return cachedPrivKey;
}

export function base64url(buf: Uint8Array): string {
	return Buffer.from(buf).toString("base64url");
}

export function base64urlDecode(str: string): Uint8Array {
	return new Uint8Array(Buffer.from(str, "base64url"));
}

/**
 * Sign a JSON payload with the Ed25519 private key and return `<base64url(payload)>.<base64url(sig)>`.
 */
export function signPayload(payload: unknown): string {
	const bytes = new TextEncoder().encode(JSON.stringify(payload));
	const sig = ed25519.sign(bytes, getPrivateKey());
	return `${base64url(bytes)}.${base64url(sig)}`;
}

/**
 * Verify a `LKEY-<payload>.<sig>` license key and return the parsed payload.
 */
export function verifyLicenseKey(keyStr: string): unknown {
	const stripped = keyStr.replace(/^LKEY-/, "");
	const [payloadB64, sigB64] = stripped.split(".");
	if (!payloadB64 || !sigB64) throw new Error("Invalid license key format");

	const payloadBytes = base64urlDecode(payloadB64);
	const sigBytes = base64urlDecode(sigB64);
	const pubKey = ed25519.getPublicKey(getPrivateKey());

	const valid = ed25519.verify(sigBytes, payloadBytes, pubKey);
	if (!valid) throw new Error("Invalid license key signature");

	return JSON.parse(new TextDecoder().decode(payloadBytes));
}
