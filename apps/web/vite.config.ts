import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
	build: {
		target: "es2020",
		// Use terser for stronger minification in production
		minify: "terser",
		terserOptions: {
			compress: {
				drop_console: true, // strip console.log
				drop_debugger: true, // strip debugger statements
				passes: 2,
			},
			mangle: {
				toplevel: true,
			},
			format: {
				comments: false,
			},
		},
		// CRITICAL: never ship source maps in production
		sourcemap: false,
	},
});
