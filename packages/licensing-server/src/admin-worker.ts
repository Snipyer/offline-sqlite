import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import adminRoutes from "./routes/admin";
import type { AppBindings } from "./types";

const app = new Hono<{ Bindings: AppBindings }>();

app.use(logger());
app.use("/*", async (c, next) => {
	const configuredOrigins = c.env.CORS_ORIGIN
		? c.env.CORS_ORIGIN.split(",")
				.map((value) => value.trim())
				.filter(Boolean)
		: [];
	const allowsAnyOrigin = configuredOrigins.includes("*");

	return cors({
		origin: (requestOrigin) => {
			if (!requestOrigin) return "*";
			if (allowsAnyOrigin || configuredOrigins.length === 0) return requestOrigin;
			return configuredOrigins.includes(requestOrigin) ? requestOrigin : "";
		},
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "x-admin-api-key", "Authorization"],
		exposeHeaders: ["Content-Length"],
		credentials: true,
	})(c, next);
});

app.route("/api/admin", adminRoutes);
app.get("/", (c) => c.json({ service: "licensing-admin-api", ok: true }));
app.get("/health", (c) => c.json({ ok: true, service: "licensing-admin-api" }));

export default app;
