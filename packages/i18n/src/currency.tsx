import {
	getCurrencyParts,
	defaultCurrency,
	currencySymbols,
	getCurrencySymbol,
	type FormattedCurrencyParts,
	type CurrencySize,
	type CurrencyProps,
} from "./formatters";

export { defaultCurrency, currencySymbols, getCurrencySymbol };
export type { CurrencySize, CurrencyProps, FormattedCurrencyParts };

const sizeClasses: Record<CurrencySize, string> = {
	sm: "text-xs",
	md: "text-sm",
	lg: "text-base",
};

export function Currency({ value, currency = "DZD", size = "md", className = "" }: CurrencyProps) {
	const { integer, fraction, symbol } = getCurrencyParts(value, currency);

	return (
		<span className={`inline-flex items-baseline gap-0.5 ${sizeClasses[size]} ${className}`}>
			<span>{integer}</span>
			{fraction && <span>.{fraction}</span>}
			<span className="ms-0.5">{symbol}</span>
		</span>
	);
}
