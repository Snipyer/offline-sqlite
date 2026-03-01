import { ed25519 } from "@noble/curves/ed25519.js";
import type { AppBindings } from "../types";

export class SigningConfigError extends Error {
	readonly code: "missing_key" | "invalid_key_length";
	readonly internalDetails: string;

	constructor(params: {
		code: "missing_key" | "invalid_key_length";
		internalDetails: string;
		publicMessage?: string;
	}) {
		super(params.publicMessage ?? "Activation service configuration error");
		this.name = "SigningConfigError";
		this.code = params.code;
		this.internalDetails = params.internalDetails;
	}
}

function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

function normalizeBase64url(input: string): string {
	return input.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function denormalizeBase64url(input: string): string {
	let value = input.replace(/-/g, "+").replace(/_/g, "/");
	while (value.length % 4 !== 0) value += "=";
	return value;
}

// Private key bytes are decoded fresh each request — no module-level cache.
// This avoids lingering secrets in isolate heap memory across requests.
function getPrivateKey(env: AppBindings): Uint8Array {
	const raw = env.LICENSE_PRIVATE_KEY_B64;
	if (!raw) {
		throw new SigningConfigError({
			code: "missing_key",
			internalDetails: "LICENSE_PRIVATE_KEY_B64 is not set",
		});
	}

	const key = base64ToBytes(raw);
	if (key.length !== 32) {
		throw new SigningConfigError({
			code: "invalid_key_length",
			internalDetails: `Decoded private key length is ${key.length}, expected 32 bytes`,
		});
	}

	return key;
}

/**
 * Resolve the Ed25519 public key.
 * Requires the explicit LICENSE_PUBLIC_KEY_B64 binding so the private key
 * never needs to be loaded when only verification is required.
 */
function getPublicKey(env: AppBindings): Uint8Array {
	if (!env.LICENSE_PUBLIC_KEY_B64) {
		throw new SigningConfigError({
			code: "missing_key",
			internalDetails:
				"LICENSE_PUBLIC_KEY_B64 is not set — configure it to avoid loading the private key for verification",
		});
	}
	const key = base64ToBytes(env.LICENSE_PUBLIC_KEY_B64);
	if (key.length !== 32) {
		throw new SigningConfigError({
			code: "invalid_key_length",
			internalDetails: `Decoded public key length is ${key.length}, expected 32 bytes`,
		});
	}
	return key;
}

export function base64url(buf: Uint8Array): string {
	return normalizeBase64url(bytesToBase64(buf));
}

export function base64urlDecode(str: string): Uint8Array {
	return base64ToBytes(denormalizeBase64url(str));
}

/**
 * Sign a JSON payload with the Ed25519 private key and return `<base64url(payload)>.<base64url(sig)>`.
 */
export function signPayload(payload: unknown, env: AppBindings): string {
	const bytes = new TextEncoder().encode(JSON.stringify(payload));
	const sig = ed25519.sign(bytes, getPrivateKey(env));
	return `${base64url(bytes)}.${base64url(sig)}`;
}

/**
 * Verify a `LKEY-<payload>.<sig>` license key and return the parsed payload.
 */
export function verifyLicenseKey(keyStr: string, env: AppBindings): unknown {
	const stripped = keyStr.replace(/^LKEY-/, "");
	const [payloadB64, sigB64] = stripped.split(".");
	// Return a generic error for all validation failures to avoid leaking details.
	if (!payloadB64 || !sigB64) throw new Error("Invalid license key");

	const payloadBytes = base64urlDecode(payloadB64);
	const sigBytes = base64urlDecode(sigB64);
	const pubKey = getPublicKey(env);

	const valid = ed25519.verify(sigBytes, payloadBytes, pubKey);
	if (!valid) throw new Error("Invalid license key");

	return JSON.parse(new TextDecoder().decode(payloadBytes));
}
