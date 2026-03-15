import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@offline-sqlite/api/context";
import { appRouter } from "@offline-sqlite/api/routers/index";
import { auth } from "@offline-sqlite/auth";
import { runMigrations } from "@offline-sqlite/db";
import { env } from "@offline-sqlite/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// ── Sidecar launch token verification (anti-extraction) ─────────
if (process.env.TAURI_ENVIRONMENT === "true" && process.env.NODE_ENV === "production") {
	const token = process.env.__TAURI_LAUNCH_TOKEN__;
	const hash = process.env.__TAURI_LAUNCH_HASH__;
	const secret = "offline-sqlite-sidecar-secret-v1";

	if (!token || !hash) {
		console.error("This server can only run inside the desktop application.");
		process.exit(1);
	}

	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(`${token}${secret}`);
	const expectedHash = hasher.digest("hex");

	if (hash !== expectedHash) {
		console.error("Launch token verification failed.");
		process.exit(1);
	}
}

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

app.get("/api/auth/oauth-complete", (c) => {
	const providerParam = c.req.query("provider");
	const errorParam = c.req.query("error");
	const provider = providerParam === "google" || providerParam === "dropbox" ? providerParam : null;
	const searchParams = new URLSearchParams();

	if (provider) {
		searchParams.set("provider", provider);
	}
	if (errorParam) {
		searchParams.set("error", errorParam);
	}

	const search = searchParams.toString();
	const deepLink = `offline-sqlite://cloud-backup/oauth-complete${search ? `?${search}` : ""}`;

	return c.html(`<!doctype html>
	<html lang="en">
		<head>
			<meta charset="utf-8" />
  			<meta name="viewport" content="width=device-width, initial-scale=1" />
  			<title>Return to offline-sqlite</title>
		</head>
		<body style="font-family: system-ui, sans-serif; margin: 24px; line-height: 1.5;">
  			<p>Authentication completed. Returning to offline-sqlite...</p>
  			<p><a href="${deepLink}">Open offline-sqlite</a></p>
  			<script>
    			window.location.replace(${JSON.stringify(deepLink)});
  			</script>
		</body>
	</html>`);
});

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
