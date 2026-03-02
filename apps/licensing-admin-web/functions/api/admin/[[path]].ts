type AdminProxyEnv = {
	LICENSING_ADMIN_API?: {
		fetch: (request: Request) => Promise<Response>;
	};
	LICENSING_ADMIN_API_URL?: string;
	ADMIN_ALLOWED_EMAIL?: string;
	CF_ACCESS_CLIENT_ID?: string;
	CF_ACCESS_CLIENT_SECRET?: string;
};

type AdminProxyContext = {
	request: Request;
	env: AdminProxyEnv;
	params: {
		path?: string | string[];
	};
};

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function getPathSuffix(path: string | string[] | undefined): string {
	if (!path) return "";
	if (Array.isArray(path)) {
		return path.filter(Boolean).join("/");
	}
	return path;
}

function jsonError(message: string, status: number): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: {
			"content-type": "application/json",
		},
	});
}

export const onRequest = async (context: AdminProxyContext): Promise<Response> => {
	const { request, env, params } = context;

	const allowedEmail = env.ADMIN_ALLOWED_EMAIL?.trim();
	if (!allowedEmail) return jsonError("Server misconfiguration: missing ADMIN_ALLOWED_EMAIL", 500);

	const requestEmail = request.headers.get("cf-access-authenticated-user-email")?.trim();
	if (!requestEmail) {
		return jsonError("Unauthorized: missing Cloudflare Access identity on dashboard domain", 401);
	}

	if (normalizeEmail(requestEmail) !== normalizeEmail(allowedEmail)) {
		return jsonError("Forbidden", 403);
	}

	const suffix = getPathSuffix(params.path);
	const requestUrl = new URL(request.url);
	const upstreamPath = `/api/admin/${suffix}`;
	const normalizedEmail = normalizeEmail(requestEmail);

	if (request.method === "OPTIONS") {
		return new Response(null, { status: 204 });
	}

	const upstreamHeaders = new Headers(request.headers);
	upstreamHeaders.delete("host");
	upstreamHeaders.delete("content-length");
	upstreamHeaders.delete("cf-connecting-ip");
	upstreamHeaders.delete("cf-access-authenticated-user-email");
	upstreamHeaders.set("x-admin-user-email", normalizedEmail);

	const hasBody = request.method !== "GET" && request.method !== "HEAD";

	let upstreamResponse: Response;
	if (env.LICENSING_ADMIN_API) {
		const upstreamUrl = new URL(upstreamPath, "https://licensing-admin.internal");
		upstreamUrl.search = requestUrl.search;

		upstreamResponse = await env.LICENSING_ADMIN_API.fetch(
			new Request(upstreamUrl.toString(), {
				method: request.method,
				headers: upstreamHeaders,
				body: hasBody ? request.body : undefined,
				redirect: "manual",
			}),
		);
	} else {
		const upstreamBase = env.LICENSING_ADMIN_API_URL?.trim();
		if (!upstreamBase) {
			return jsonError(
				"Server misconfiguration: missing LICENSING_ADMIN_API service binding or LICENSING_ADMIN_API_URL",
				500,
			);
		}

		const accessClientId = env.CF_ACCESS_CLIENT_ID?.trim();
		const accessClientSecret = env.CF_ACCESS_CLIENT_SECRET?.trim();
		if (accessClientId && accessClientSecret) {
			upstreamHeaders.set("CF-Access-Client-Id", accessClientId);
			upstreamHeaders.set("CF-Access-Client-Secret", accessClientSecret);
		}

		const upstreamUrl = new URL(upstreamPath, upstreamBase);
		upstreamUrl.search = requestUrl.search;

		upstreamResponse = await fetch(upstreamUrl.toString(), {
			method: request.method,
			headers: upstreamHeaders,
			body: hasBody ? request.body : undefined,
			redirect: "manual",
		});
	}

	const redirectLocation = upstreamResponse.headers.get("location");
	if (
		redirectLocation?.includes("/cdn-cgi/access/login/") ||
		redirectLocation?.includes(".cloudflareaccess.com")
	) {
		return jsonError(
			"Upstream Access challenge detected. Configure API Service Auth policy and valid CF_ACCESS_CLIENT_ID/CF_ACCESS_CLIENT_SECRET secrets on licensing-admin-web Pages.",
			502,
		);
	}

	const responseHeaders = new Headers(upstreamResponse.headers);
	responseHeaders.delete("access-control-allow-origin");
	responseHeaders.delete("access-control-allow-credentials");
	responseHeaders.delete("access-control-expose-headers");
	responseHeaders.delete("vary");

	return new Response(upstreamResponse.body, {
		status: upstreamResponse.status,
		headers: responseHeaders,
	});
};
