import { env } from "@offline-sqlite/env/web";
import { createAuthClient } from "better-auth/react";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { isTauri } from "@/utils/is-tauri";

export const authClient = createAuthClient({
	baseURL: env.VITE_SERVER_URL,
	fetchOptions: {
		// Use Tauri's HTTP plugin to handle cookies properly across origins
		customFetchImpl: async (...params: Parameters<typeof fetch>) => {
			const [input, init] = params;
			if (isTauri()) {
				return tauriFetch(input as string, init as RequestInit);
			}
			return fetch(input, init);
		},
	},
});
