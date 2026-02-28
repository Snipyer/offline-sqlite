import type { Context, Next } from "hono";
import type { AppBindings } from "../types";

type AccessContext = Context<{ Bindings: AppBindings }>;

export async function requireAdminAccess(c: AccessContext, next: Next) {
	const accessEmail = c.req.header("cf-access-authenticated-user-email");
	if (accessEmail) {
		return next();
	}

	const providedApiKey = c.req.header("x-admin-api-key");
	if (providedApiKey && c.env.ADMIN_DEV_API_KEY && providedApiKey === c.env.ADMIN_DEV_API_KEY) {
		return next();
	}

	return c.json({ error: "Unauthorized" }, 401);
}
