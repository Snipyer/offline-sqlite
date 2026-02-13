import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@offline-sqlite/i18n";

export function ModeToggle() {
	const { setTheme } = useTheme();
	const { t } = useTranslation();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" />}>
				<Sun className="size-4 transition-all" />
				<Moon
					className="absolute size-4 rotate-90 opacity-0 transition-all dark:rotate-0
						dark:opacity-100"
				/>
				<span className="sr-only">{t("theme.toggle")}</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme("light")}>
					<Sun className="me-2 size-4" />
					{t("theme.light")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")}>
					<Moon className="me-2 size-4" />
					{t("theme.dark")}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="me-2 size-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect width="4" height="16" x="2" y="3" rx="1" />
						<rect width="4" height="16" x="14" y="3" rx="1" />
						<rect width="4" height="16" x="8" y="13" rx="1" />
						<rect width="4" height="16" x="14" y="13" rx="1" />
						<rect width="4" height="16" x="2" y="3" rx="1" />
						<rect width="4" height="16" x="14" y="3" rx="1" />
						<rect width="4" height="16" x="8" y="3" rx="1" />
						<rect width="4" height="16" x="2" y="13" rx="1" />
					</svg>
					{t("theme.system")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
