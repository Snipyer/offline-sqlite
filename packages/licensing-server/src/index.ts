import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import activate from "./routes/activate";
import deactivate from "./routes/deactivate";
import validate from "./routes/validate";
import { ensureDatabase } from "./db";
import type { AppBindings } from "./types";

const app = new Hono<{ Bindings: AppBindings }>();

app.use(logger());
app.use("/*", async (c, next) => {
	const origin = c.env.CORS_ORIGIN;
	return cors({ origin: origin ? origin.split(",") : "*" })(c, next);
});

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
