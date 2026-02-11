import type { AppRouter } from "@offline-sqlite/api/routers/index";

import { env } from "@offline-sqlite/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { isTauri } from "./is-tauri";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			toast.error(error.message, {
				action: {
					label: "retry",
					onClick: query.invalidate,
				},
			});
		},
	}),
});

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${env.VITE_SERVER_URL}/trpc`,
			fetch(url, options) {
				const fetchFn = isTauri() ? tauriFetch : fetch;
				return fetchFn(
					url as string,
					{
						...(options || {}),
						credentials: "include",
					} as RequestInit,
				);
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
