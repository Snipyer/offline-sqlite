import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@offline-sqlite/api/context";
import { appRouter } from "@offline-sqlite/api/routers/index";
import { auth } from "@offline-sqlite/auth";
import { runMigrations } from "@offline-sqlite/db";
import { env } from "@offline-sqlite/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Run migrations on startup (only if MIGRATIONS_FOLDER is set)
if (process.env.MIGRATIONS_FOLDER) {
	await runMigrations(process.env.MIGRATIONS_FOLDER);
}

const app = new Hono();

app.use(logger());

const corsOrigins = String(env.CORS_ORIGIN ?? "")
	.split(",")
	.map((origin) => origin.trim());

app.use(
	"/*",
	cors({
		origin: corsOrigins,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "x-locale"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
