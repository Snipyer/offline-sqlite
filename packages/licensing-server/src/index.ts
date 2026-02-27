import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import activate from "./routes/activate";
import deactivate from "./routes/deactivate";
import validate from "./routes/validate";
import admin from "./routes/admin";

const app = new Hono();

app.use(logger());
app.use("/*", cors());

// Public endpoints (called by client apps)
app.route("/api/activate", activate);
app.route("/api/deactivate", deactivate);
app.route("/api/validate", validate);

// Admin endpoints (protect with basic auth or API key in production)
app.route("/api/admin", admin);

app.get("/", (c) => c.text("License Server OK"));

const port = Number(process.env.PORT ?? 4000);

export default {
	port,
	fetch: app.fetch,
};
