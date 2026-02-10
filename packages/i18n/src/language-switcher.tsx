import type { ChangeEvent } from "react";

import { supportedLanguages, toSupportedLanguage, useTranslation, type SupportedLanguageCode } from "./core";

export default function LanguageSwitcher() {
	const { i18n, t } = useTranslation();
	const currentLanguage = toSupportedLanguage(i18n.resolvedLanguage ?? i18n.language);
	const labels: Record<SupportedLanguageCode, string> = {
		en: t("language.english"),
		fr: t("language.french"),
		ar: t("language.arabic"),
	};

	return (
		<label className="inline-flex items-center gap-2 text-xs">
			<span className="text-muted-foreground">{t("language.label")}</span>
			<select
				className="border-border bg-background h-8 rounded-none border px-2 text-xs"
				value={currentLanguage}
				onChange={(event: ChangeEvent<HTMLSelectElement>) => i18n.changeLanguage(event.target.value)}
				aria-label={t("language.label")}
			>
				{supportedLanguages.map(({ code }) => (
					<option key={code} value={code}>
						{labels[code]}
					</option>
				))}
			</select>
		</label>
	);
}
