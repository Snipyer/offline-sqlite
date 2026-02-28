import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const adminEnv = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_LICENSING_ADMIN_API_URL: z.url().optional(),
		VITE_LICENSING_ADMIN_API_KEY: z.string().optional(),
	},
	runtimeEnv: (import.meta as any).env,
	emptyStringAsUndefined: true,
});
