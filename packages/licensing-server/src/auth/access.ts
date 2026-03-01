import type { Context, Next } from "hono";
import type { AppBindings } from "../types";

type AccessContext = Context<{ Bindings: AppBindings }>;

/**
 * Timing-safe comparison using SHA-256 digests to prevent timing attacks.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
	const encoder = new TextEncoder();
	const [hashA, hashB] = await Promise.all([
		crypto.subtle.digest("SHA-256", encoder.encode(a)),
		crypto.subtle.digest("SHA-256", encoder.encode(b)),
	]);
	const viewA = new Uint8Array(hashA);
	const viewB = new Uint8Array(hashB);
	let result = 0;
	for (let i = 0; i < viewA.byteLength; i++) {
		result |= viewA[i]! ^ viewB[i]!;
	}
	return result === 0;
}

export async function requireAdminAccess(c: AccessContext, next: Next) {
	// Cloudflare Access (production auth)
	const accessEmail = c.req.header("cf-access-authenticated-user-email");
	if (accessEmail) {
		return next();
	}

	// Block API key fallback in production — only Cloudflare Access is accepted.
	if (c.env.ENVIRONMENT === "production") {
		return c.json({ error: "Unauthorized" }, 401);
	}

	// API key fallback for non-production environments (local dev / preview).
	const providedApiKey = c.req.header("x-admin-api-key");
	if (providedApiKey && c.env.ADMIN_DEV_API_KEY) {
		const isValid = await timingSafeEqual(providedApiKey, c.env.ADMIN_DEV_API_KEY);
		if (isValid) return next();
	}

	return c.json({ error: "Unauthorized" }, 401);
}
