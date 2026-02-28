import { getLanguageDirection, i18n, I18nextProvider, useTranslation } from "@offline-sqlite/i18n";
import { useEffect } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./index.css";

export const links = () => [];

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
		document.documentElement.lang = currentLanguage;
		document.documentElement.dir = direction;
	}, [currentLanguage, direction]);

	return null;
}

export default function App() {
	return (
		<I18nextProvider i18n={i18n}>
			<DocumentLanguageSync />
			<Outlet />
		</I18nextProvider>
	);
}

export function ErrorBoundary({ error }: { error: unknown }) {
	const message = isRouteErrorResponse(error) ? String(error.status) : i18n.t("errors.error");
	const details = isRouteErrorResponse(error)
		? error.statusText || i18n.t("errors.unexpected")
		: error instanceof Error
			? error.message
			: i18n.t("errors.unexpected");

	return (
		<main style={{ maxWidth: "900px", margin: "40px auto", padding: "16px" }}>
			<h1>{message}</h1>
			<p>{details}</p>
		</main>
	);
}
