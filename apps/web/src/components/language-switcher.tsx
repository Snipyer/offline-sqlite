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
			<DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" />}>
				{languageShortLabels[currentLanguage]}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{supportedLanguages.map(({ code }) => (
					<DropdownMenuItem
						key={code}
						onClick={() => i18n.changeLanguage(code)}
						className={currentLanguage === code ? "bg-accent" : ""}
					>
						{t(`language.${languageKeys[code]}`)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
