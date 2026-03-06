import { getCurrencySymbol, type CurrencyProps, type CurrencySize } from "@offline-sqlite/i18n";
import { cn } from "@/lib/utils";
import Counter from "@/components/Counter";

const sizeToFontSize: Record<CurrencySize, number> = {
	sm: 12,
	md: 14,
	lg: 16,
};

function normalizeCurrencyValue(value: number, showCents: boolean): number {
	if (showCents) {
		return Math.round(value * 100) / 100;
	}

	return Math.trunc(value);
}

export function formatCurrencyText({
	value,
	currency = "DZD",
	showCents = true,
}: Pick<CurrencyProps, "value" | "currency" | "showCents">): string {
	const normalizedValue = normalizeCurrencyValue(value, showCents);
	const symbol = getCurrencySymbol(currency);
	return `${normalizedValue.toLocaleString()} ${symbol}`;
}

export function Currency({
	value,
	currency = "DZD",
	size = "md",
	fontSize,
	showCents = true,
	className = "",
}: CurrencyProps) {
	const normalizedValue = normalizeCurrencyValue(value, showCents);
	const symbol = getCurrencySymbol(currency);
	const resolvedFontSize = fontSize ?? sizeToFontSize[size];

	return (
		<span className={cn("inline-flex items-center gap-0.5", className)}>
			<span dir="ltr" className="inline-flex items-center leading-none">
				<Counter
					value={normalizedValue}
					fontSize={resolvedFontSize}
					horizontalPadding={0}
					gap={0}
					padding={0}
					gradientHeight={0}
				/>
			</span>
			<span
				style={{ fontSize: resolvedFontSize }}
				className="ms-0.5 inline-flex items-center leading-none"
			>
				{symbol}
			</span>
		</span>
	);
}
