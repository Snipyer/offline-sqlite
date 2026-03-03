import type { VariantProps } from "class-variance-authority";
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
import { Button, buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

interface LanguageSwitcherProps {
	triggerVariant?: ButtonVariant;
	triggerClassName?: string;
}

export default function LanguageSwitcher({
	triggerVariant = "outline",
	triggerClassName,
}: LanguageSwitcherProps) {
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
						variant={triggerVariant}
						size="icon"
						className={cn(
							`border-border/50 bg-background/50 hover:border-border hover:bg-muted h-9 w-9
							rounded-xl transition-all duration-200`,
							triggerClassName,
						)}
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
