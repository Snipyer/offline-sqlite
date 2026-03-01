import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
	// Load ALL env vars (not just VITE_ prefixed) so we can read LICENSING_ADMIN_API_KEY.
	const env = loadEnv(mode, process.cwd(), "");

	return {
		plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
		server: {
			port: 8080,
		},
		define: {
			// Inject the dev API key ONLY in development mode.
			// In production builds the value is always an empty string,
			// ensuring the key can never leak into shipped bundles.
			__DEV_ADMIN_API_KEY__: JSON.stringify(
				mode === "development" ? (env.LICENSING_ADMIN_API_KEY ?? "") : "",
			),
		},
	};
});
