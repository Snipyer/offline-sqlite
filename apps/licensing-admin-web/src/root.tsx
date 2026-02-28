import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./index.css";

export const links = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
				<title>Licensing Admin</title>
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: { error: unknown }) {
	const message = isRouteErrorResponse(error) ? String(error.status) : "Error";
	const details = isRouteErrorResponse(error)
		? error.statusText || "Unexpected error"
		: error instanceof Error
			? error.message
			: "Unexpected error";

	return (
		<main className="mx-auto max-w-4xl p-4 pt-10">
			<h1>{message}</h1>
			<p>{details}</p>
		</main>
	);
}
