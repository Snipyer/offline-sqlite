import { i18n } from "./core";

export const defaultCurrency = "DZD";

export const currencySymbols: Record<string, Record<string, string>> = {
	DZD: {
		en: "DZD",
		fr: "DZD",
		ar: "دج",
	},
	USD: {
		en: "$",
		fr: "$",
		ar: "$",
	},
	EUR: {
		en: "€",
		fr: "€",
		ar: "€",
	},
};

export function getCurrencySymbol(currency: string, locale?: string): string {
	const lang = locale ?? getLocale();
	return currencySymbols[currency]?.[lang] ?? currency;
}

export type DateStyleLegacy = "short" | "medium" | "long" | "full";
export type DateStyle = DateStyleLegacy | "dd/mm/yyyy";
export type NumberStyle = "decimal" | "currency" | "percent" | "unit";

function getLocale(): string {
	return i18n.resolvedLanguage ?? i18n.language ?? "en";
}

export function formatDate(
	date: Date | number,
	style: DateStyle = "dd/mm/yyyy",
	options?: Intl.DateTimeFormatOptions,
): string {
	const locale = getLocale();

	if (style === "dd/mm/yyyy") {
		const formatLocale = locale === "ar" ? "ar" : "en-GB";
		return new Intl.DateTimeFormat(formatLocale, {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			...options,
		}).format(typeof date === "number" ? new Date(date) : date);
	}

	const styleMap: Record<DateStyleLegacy, Intl.DateTimeFormatOptions> = {
		short: { dateStyle: "short" },
		medium: { dateStyle: "medium" },
		long: { dateStyle: "long" },
		full: { dateStyle: "full" },
	};

	const legacyStyle = styleMap[style as DateStyleLegacy];
	if (legacyStyle) {
		return new Intl.DateTimeFormat(locale, options ?? legacyStyle).format(
			typeof date === "number" ? new Date(date) : date,
		);
	}

	return new Intl.DateTimeFormat(locale, options ?? styleMap.medium).format(
		typeof date === "number" ? new Date(date) : date,
	);
}

export function formatTime(date: Date | number, options?: Intl.DateTimeFormatOptions): string {
	const locale = getLocale();
	const defaultOptions: Intl.DateTimeFormatOptions = {
		hour: "2-digit",
		minute: "2-digit",
	};

	return new Intl.DateTimeFormat(locale, options ?? defaultOptions).format(
		typeof date === "number" ? new Date(date) : date,
	);
}

export function formatDateTime(
	date: Date | number,
	dateStyle: DateStyle = "dd/mm/yyyy",
	timeOptions?: Intl.DateTimeFormatOptions,
): string {
	const locale = getLocale();

	const defaultTimeOptions: Intl.DateTimeFormatOptions = {
		hour: "2-digit",
		minute: "2-digit",
	};

	if (dateStyle === "dd/mm/yyyy") {
		const formatLocale = locale === "ar" ? "ar" : "en-GB";
		return new Intl.DateTimeFormat(formatLocale, {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			...defaultTimeOptions,
			...timeOptions,
		}).format(typeof date === "number" ? new Date(date) : date);
	}

	const styleMap: Record<DateStyleLegacy, Intl.DateTimeFormatOptions> = {
		short: { dateStyle: "short" },
		medium: { dateStyle: "medium" },
		long: { dateStyle: "long" },
		full: { dateStyle: "full" },
	};

	const legacyStyle = styleMap[dateStyle as DateStyleLegacy] ?? styleMap.medium;

	return new Intl.DateTimeFormat(locale, {
		...legacyStyle,
		...defaultTimeOptions,
		...timeOptions,
	}).format(typeof date === "number" ? new Date(date) : date);
}

export function formatNumber(
	value: number,
	style: NumberStyle = "decimal",
	options?: Intl.NumberFormatOptions,
): string {
	const locale = getLocale();

	const styleMap: Record<NumberStyle, Intl.NumberFormatOptions> = {
		decimal: { style: "decimal" },
		currency: { style: "currency", currency: defaultCurrency },
		percent: { style: "percent" },
		unit: { style: "unit", unit: "unit" },
	};

	return new Intl.NumberFormat(locale, options ?? styleMap[style]).format(value);
}

export function formatCurrency(
	value: number,
	currency: string = defaultCurrency,
	options?: Intl.NumberFormatOptions,
): string {
	const locale = getLocale();

	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		...options,
	}).format(value);
}

export function formatCurrencyWithSymbol(
	value: number,
	currency: string = defaultCurrency,
	options?: Intl.NumberFormatOptions,
): string {
	const locale = getLocale();
	const symbol = getCurrencySymbol(currency, locale);
	const formatted = new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
		...options,
	}).format(value);

	return `${formatted} ${symbol}`;
}

export interface FormattedCurrencyParts {
	integer: string;
	fraction: string;
	symbol: string;
}

export function getCurrencyParts(
	value: number,
	currency: string = defaultCurrency,
	options?: Intl.NumberFormatOptions,
): FormattedCurrencyParts {
	const locale = getLocale();
	const symbol = getCurrencySymbol(currency, locale);

	const formatted = new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
		numberingSystem: "latn",
		...options,
	}).format(value);

	const parts = formatted.split(/\.|\,/);
	const integer = parts[0] ?? "";
	const fraction = parts.slice(1).join(locale === "en" ? "," : ".");

	return { integer, fraction, symbol };
}

export type CurrencySize = "sm" | "md" | "lg";

export interface CurrencyProps {
	value: number;
	currency?: string;
	size?: CurrencySize;
	showCents?: boolean;
	className?: string;
}

export function formatCompact(
	value: number,
	notation: "compact" | "scientific" | "engineering" = "compact",
): string {
	const locale = getLocale();

	return new Intl.NumberFormat(locale, {
		notation,
		maximumFractionDigits: 1,
	}).format(value);
}
