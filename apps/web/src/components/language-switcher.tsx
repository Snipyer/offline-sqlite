import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	languageShortLabels,
	supportedLanguages,
	toSupportedLanguage,
	useTranslation,
} from "@offline-sqlite/i18n";
import { Button } from "./ui/button";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
	const { i18n, t } = useTranslation();
	const currentLanguage = toSupportedLanguage(String(i18n.resolvedLanguage ?? i18n.language ?? "en"));

	const languageKeys: Record<string, "english" | "french" | "arabic"> = {
		en: "english",
		fr: "french",
		ar: "arabic",
	};

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
						<span className="text-xs font-medium">{languageShortLabels[currentLanguage]}</span>
					</Button>
				}
			/>
			<DropdownMenuContent align="end">
				{supportedLanguages.map(({ code }) => (
					<DropdownMenuItem
						key={code}
						onClick={() => i18n.changeLanguage(code)}
						className={cn(currentLanguage === code && "bg-accent")}
					>
						{t(`language.${languageKeys[code]}`)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
