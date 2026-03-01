import type { Context, Next } from "hono";

/**
 * Simple per-isolate rate limiter for Cloudflare Workers.
 *
 * This provides basic per-IP throttling within a single Worker isolate.
 * The in-memory store resets whenever the isolate is recycled, so this is
 * best-effort only.
 *
 * **IMPORTANT – production hardening:**
 * Supplement this with Cloudflare's built-in Rate Limiting Rules
 * (Dashboard → Security → WAF → Rate limiting rules) for cross-isolate,
 * cross-location enforcement that survives isolate recycling.
 */

type RateLimitEntry = { count: number; windowStart: number };

const store = new Map<string, RateLimitEntry>();
const CLEANUP_THRESHOLD = 5_000;

type RateLimitOptions = {
	/** Time window in milliseconds */
	windowMs: number;
	/** Maximum requests per window per IP */
	max: number;
};

export function rateLimit({ windowMs, max }: RateLimitOptions) {
	return async (c: Context, next: Next) => {
		const ip = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "unknown";
		const now = Date.now();

		let entry = store.get(ip);
		if (!entry || now - entry.windowStart > windowMs) {
			entry = { count: 0, windowStart: now };
			store.set(ip, entry);
		}

		entry.count++;

		if (entry.count > max) {
			const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
			c.header("Retry-After", String(retryAfter));
			return c.json({ error: "Too many requests" }, 429);
		}

		// Periodic cleanup to prevent unbounded memory growth
		if (store.size > CLEANUP_THRESHOLD) {
			for (const [key, val] of store) {
				if (now - val.windowStart > windowMs) store.delete(key);
			}
		}

		await next();
	};
}
