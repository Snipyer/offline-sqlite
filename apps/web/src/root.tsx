import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import "./index.css";
import { initAntiDebug } from "./utils/anti-debug";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import { Titlebar } from "./components/titlebar";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { queryClient } from "./utils/trpc";
import { getLanguageDirection, i18n, I18nextProvider, useTranslation } from "@offline-sqlite/i18n";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { isTauri } from "./utils/is-tauri";
import { cn } from "./lib/utils";
import { AppSidebar } from "./components/app-sidebar";
import { SidebarProvider, SidebarInset } from "./components/ui/sidebar";
import { authClient } from "./lib/auth-client";
import { ScrollToTopButton } from "./components/scroll-to-top-button";
import ActivationScreen from "./features/licensing/components/activation-screen";
import TrialExpired from "./features/licensing/components/trial-expired";
import { useLicense } from "./features/licensing/hooks/use-license";
import Loader from "./components/loader";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

function DocumentLanguageSync() {
	const { i18n: instance } = useTranslation();
	const currentLanguage = instance.resolvedLanguage ?? instance.language;
	const direction = getLanguageDirection(currentLanguage);

	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}
		document.documentElement.lang = currentLanguage;
		document.documentElement.dir = direction;
	}, [currentLanguage, direction]);

	return null;
}

export default function App() {
	const { i18n: instance } = useTranslation();
	const currentLanguage = instance.resolvedLanguage ?? instance.language;
	const direction = getLanguageDirection(currentLanguage);
	const sidebarSide = direction === "rtl" ? "right" : "left";
	const { data: session } = authClient.useSession();
	const isAuthenticated = !!session;

	// Initialize anti-debug measures in production Tauri builds
	useEffect(() => {
		if (isTauri()) initAntiDebug();
	}, []);

	// License gate — only active inside Tauri (desktop) builds
	const isTauriEnv = isTauri();
	const { licenseState, loading: licenseLoading } = useLicense();

	// In Tauri mode, block the app behind a license check
	const showLicenseGate =
		isTauriEnv && !licenseLoading && licenseState.state !== "valid" && licenseState.state !== "trial";

	return (
		<I18nextProvider i18n={i18n}>
			<DirectionProvider direction={direction}>
				<DocumentLanguageSync />
				<QueryClientProvider client={queryClient}>
					<ThemeProvider
						attribute="class"
						defaultTheme="dark"
						disableTransitionOnChange
						storageKey="vite-ui-theme"
					>
						<div className="flex h-screen flex-col">
							{isTauriEnv && <Titlebar />}

							{/* License loading state */}
							{isTauriEnv && licenseLoading && <Loader />}

							{/* License gate — show activation or trial-expired screen */}
							{showLicenseGate && (
								<>
									{licenseState.state === "trial_expired" ? (
										<TrialExpired />
									) : (
										<ActivationScreen />
									)}
								</>
							)}

							{/* Main app — shown only when license is OK (or not Tauri) */}
							{(!isTauriEnv || (!licenseLoading && !showLicenseGate)) && (
								<>
									<div className="app-content">
										{isAuthenticated ? (
											<SidebarProvider defaultOpen side={sidebarSide}>
												<AppSidebar />
												<SidebarInset>
													<Outlet />
												</SidebarInset>
											</SidebarProvider>
										) : (
											<Outlet />
										)}
									</div>
								</>
							)}
							<ScrollToTopButton />
							<Toaster richColors />
						</div>
					</ThemeProvider>
				</QueryClientProvider>
			</DirectionProvider>
		</I18nextProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = i18n.t("errors.oops");
	let details = i18n.t("errors.unexpected");
	let stack: string | undefined;
	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : i18n.t("errors.error");
		details = error.status === 404 ? i18n.t("errors.notFound") : error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}
	return (
		<main className="container mx-auto p-4 pt-16">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto p-4">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
