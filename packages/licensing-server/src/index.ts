import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";

import activate from "./routes/activate";
import deactivate from "./routes/deactivate";
import validate from "./routes/validate";
import { ensureDatabase } from "./db";
import { rateLimit } from "./middleware/rate-limit";
import type { AppBindings } from "./types";

const app = new Hono<{ Bindings: AppBindings }>();

app.use(logger());
app.use("/*", async (c, next) => {
	const origins = c.env.CORS_ORIGIN
		? c.env.CORS_ORIGIN.split(",")
				.map((s) => s.trim())
				.filter(Boolean)
		: [];
	// If no origins configured, reject all cross-origin requests.
	return cors({ origin: origins.length > 0 ? origins : [] })(c, next);
});

// Body size limit: 50 KB
app.use("/api/*", bodyLimit({ maxSize: 50 * 1024 }));

// Rate limiting: 60 requests per minute per IP
app.use("/api/*", rateLimit({ windowMs: 60_000, max: 60 }));

app.use("/api/*", async (c, next) => {
	await ensureDatabase(c.env);
	await next();
});

// Public endpoints (called by client apps)
app.route("/api/activate", activate);
app.route("/api/deactivate", deactivate);
app.route("/api/validate", validate);

app.get("/", (c) => c.json({ service: "licensing-public-api", ok: true }));
app.get("/health", (c) => c.json({ ok: true, service: "licensing-public-api" }));

export default app;
