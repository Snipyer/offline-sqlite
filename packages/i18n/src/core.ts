import i18next, { type i18n as I18nInstance } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import ar from "../languages/ar.json";
import en from "../languages/en.json";
import fr from "../languages/fr.json";

const resources = {
	en: {
		translation: en,
	},
	fr: {
		translation: fr,
	},
	ar: {
		translation: ar,
	},
} as const;

const supportedLanguageCodes = ["en", "fr", "ar"] as const;
export type SupportedLanguageCode = (typeof supportedLanguageCodes)[number];

export const supportedLanguages = [
	{ code: "en", dir: "ltr" },
	{ code: "fr", dir: "ltr" },
	{ code: "ar", dir: "rtl" },
] as const;

export const localeCookieName = "offline-sqlite.locale";
export const localeStorageKey = localeCookieName;

export const i18n: I18nInstance = i18next.createInstance();
const isBrowser =
	typeof globalThis !== "undefined" &&
	typeof (globalThis as { document?: unknown }).document !== "undefined";

if (isBrowser) {
	i18n.use(LanguageDetector);
}

void i18n.use(initReactI18next).init({
	resources,
	fallbackLng: "en",
	supportedLngs: supportedLanguageCodes,
	defaultNS: "translation",
	interpolation: {
		escapeValue: false,
	},
	detection: isBrowser
		? {
				order: ["cookie", "localStorage", "navigator", "htmlTag"],
				caches: ["cookie", "localStorage"],
				lookupLocalStorage: localeStorageKey,
				lookupCookie: localeCookieName,
			}
		: undefined,
});

export function toSupportedLanguage(language?: string): SupportedLanguageCode {
	const normalized = (language ?? "en").split("-")[0]?.toLowerCase() ?? "en";
	return supportedLanguageCodes.includes(normalized as SupportedLanguageCode)
		? (normalized as SupportedLanguageCode)
		: "en";
}

export function getLanguageDirection(language?: string): "ltr" | "rtl" {
	return toSupportedLanguage(language) === "ar" ? "rtl" : "ltr";
}

export { I18nextProvider, useTranslation } from "react-i18next";
