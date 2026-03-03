import { getCurrentWindow } from "@tauri-apps/api/window";
import { ArrowLeft, ArrowRight, Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router";
import { authClient } from "@/lib/auth-client";
import { LicenseStatusDialog } from "@/features/licensing/components/license-status-dialog";
import LanguageSwitcher from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";

export function Titlebar() {
	const navigate = useNavigate();
	const location = useLocation();
	const navigationType = useNavigationType();
	const appWindow = getCurrentWindow();
	const { data: session } = authClient.useSession();
	const isAuthenticated = !!session;
	const [historyPosition, setHistoryPosition] = useState(() => {
		const initialKey = location.key || "initial";

		return {
			entries: [initialKey],
			index: 0,
		};
	});

	useEffect(() => {
		const currentKey = location.key || "initial";

		setHistoryPosition((prev) => {
			if (navigationType === "PUSH") {
				const nextEntries = [...prev.entries.slice(0, prev.index + 1), currentKey];

				return {
					entries: nextEntries,
					index: nextEntries.length - 1,
				};
			}

			if (navigationType === "REPLACE") {
				const nextEntries = [...prev.entries];
				nextEntries[prev.index] = currentKey;

				return {
					entries: nextEntries,
					index: prev.index,
				};
			}

			const existingIndex = prev.entries.lastIndexOf(currentKey);

			if (existingIndex >= 0) {
				return {
					entries: prev.entries,
					index: existingIndex,
				};
			}

			const nextEntries = [...prev.entries, currentKey];

			return {
				entries: nextEntries,
				index: nextEntries.length - 1,
			};
		});
	}, [location.key, navigationType]);

	const canGoBack = historyPosition.index > 0;
	const canGoForward = historyPosition.index < historyPosition.entries.length - 1;

	return (
		<div className="titlebar" data-tauri-drag-region>
			<div className="flex items-center gap-1 pl-2">
				<button
					onClick={() => navigate(-1)}
					className="titlebar-button disabled:pointer-events-none disabled:opacity-40"
					type="button"
					aria-label="Go back"
					disabled={!canGoBack}
				>
					<ArrowLeft size={16} />
				</button>
				<button
					onClick={() => navigate(1)}
					className="titlebar-button disabled:pointer-events-none disabled:opacity-40"
					type="button"
					aria-label="Go forward"
					disabled={!canGoForward}
				>
					<ArrowRight size={16} />
				</button>
			</div>

			<div
				className="text-muted-foreground flex flex-1 items-center justify-center gap-2 text-sm
					font-medium"
				data-tauri-drag-region
			>
				<span>offline-sqlite</span>
			</div>

			<div className="flex items-center">
				{!isAuthenticated && (
					<>
						<LanguageSwitcher
							triggerVariant="ghost"
							triggerClassName="titlebar-button border-border/0"
						/>
						<ModeToggle
							triggerVariant="ghost"
							triggerClassName="titlebar-button border-border/0"
						/>
					</>
				)}
				<LicenseStatusDialog />
				<div className="bg-border mx-2 h-4 w-px" />

				<button
					className="titlebar-button"
					onClick={() => appWindow.minimize()}
					type="button"
					aria-label="Minimize"
				>
					<Minus size={16} />
				</button>
				<button
					className="titlebar-button"
					onClick={() => appWindow.toggleMaximize()}
					type="button"
					aria-label="Maximize"
				>
					<Square size={14} />
				</button>
				<button
					className="titlebar-button hover:bg-destructive hover:text-destructive-foreground"
					onClick={() => appWindow.close()}
					type="button"
					aria-label="Close"
				>
					<X size={16} />
				</button>
			</div>
		</div>
	);
}
