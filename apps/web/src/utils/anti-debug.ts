/**
 * Anti-debugging measures for production builds.
 * Import this early in root.tsx — it self-executes.
 *
 * This is a deterrent, not bulletproof. It blocks casual inspection by:
 * - Detecting DevTools via `debugger` statement timing
 * - Disabling right-click context menu
 * - Blocking common DevTools keyboard shortcuts
 */
export function initAntiDebug() {
	if (import.meta.env.DEV) return; // skip in development

	// Detect DevTools via debugger statement timing
	const threshold = 100;
	const interval = setInterval(() => {
		const start = performance.now();
		// eslint-disable-next-line no-debugger
		debugger;
		const duration = performance.now() - start;
		if (duration > threshold) {
			clearInterval(interval);
			document.body.innerHTML = "";
			window.location.href = "about:blank";
		}
	}, 3000);

	// Disable right-click context menu
	document.addEventListener("contextmenu", (e) => e.preventDefault());

	// Disable common keyboard shortcuts for DevTools
	document.addEventListener("keydown", (e) => {
		if (
			e.key === "F12" ||
			(e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
			(e.ctrlKey && e.key === "U")
		) {
			e.preventDefault();
		}
	});
}
