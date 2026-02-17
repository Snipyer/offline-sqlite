import { Moon, Sun, Monitor } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@offline-sqlite/i18n";
import { cn } from "@/lib/utils";

export function ModeToggle() {
	const { setTheme, theme } = useTheme();
	const { t } = useTranslation();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="outline"
						size="icon"
						className="border-border/50 bg-background/50 hover:border-border hover:bg-muted h-9
							w-9 rounded-xl transition-all duration-200"
					>
						<Sun
							className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
						/>
						<Moon
							className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100
								dark:rotate-0"
						/>
						<span className="sr-only">{t("theme.toggle")}</span>
					</Button>
				}
			/>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() => setTheme("light")}
					className={cn(theme === "light" && "bg-accent")}
				>
					<Sun className="mr-2 h-4 w-4" />
					{t("theme.light")}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("dark")}
					className={cn(theme === "dark" && "bg-accent")}
				>
					<Moon className="mr-2 h-4 w-4" />
					{t("theme.dark")}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("system")}
					className={cn(theme === "system" && "bg-accent")}
				>
					<Monitor className="mr-2 h-4 w-4" />
					{t("theme.system")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
