import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";
import adminRoutes from "./routes/admin";
import { ensureDatabase } from "./db";
import { rateLimit } from "./middleware/rate-limit";
import type { AppBindings } from "./types";

const app = new Hono<{ Bindings: AppBindings }>();

app.use(logger());
app.use("/*", async (c, next) => {
	const configuredOrigins = c.env.CORS_ORIGIN
		? c.env.CORS_ORIGIN.split(",")
				.map((value) => value.trim())
				.filter(Boolean)
		: [];

	return cors({
		origin: (requestOrigin) => {
			// Reject cross-origin if no origins configured
			if (!requestOrigin || configuredOrigins.length === 0) return "";
			if (configuredOrigins.includes("*")) return requestOrigin;
			return configuredOrigins.includes(requestOrigin) ? requestOrigin : "";
		},
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "x-admin-api-key", "Authorization"],
		exposeHeaders: ["Content-Length"],
		credentials: true,
	})(c, next);
});

// Body size limit: 50 KB
app.use("/api/*", bodyLimit({ maxSize: 50 * 1024 }));

// Rate limiting: 30 requests per minute per IP
app.use("/api/*", rateLimit({ windowMs: 60_000, max: 30 }));

app.use("/api/*", async (c, next) => {
	await ensureDatabase(c.env);
	await next();
});

app.route("/api/admin", adminRoutes);
app.get("/", (c) => c.json({ service: "licensing-admin-api", ok: true }));
app.get("/health", (c) => c.json({ ok: true, service: "licensing-admin-api" }));

export default app;
