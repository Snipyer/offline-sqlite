import { getCurrencySymbol, type CurrencyProps, type CurrencySize } from "@offline-sqlite/i18n";
import { cn } from "@/lib/utils";
import Counter from "@/components/Counter";

const sizeClasses: Record<CurrencySize, string> = {
	sm: "text-xs",
	md: "text-sm",
	lg: "text-base",
};

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

export function Currency({
	value,
	currency = "DZD",
	size = "md",
	showCents = true,
	className = "",
}: CurrencyProps) {
	const normalizedValue = normalizeCurrencyValue(value, showCents);
	const symbol = getCurrencySymbol(currency);

	return (
		<span className={cn("inline-flex items-center gap-0.5", sizeClasses[size], className)}>
			<span dir="ltr" className="inline-flex items-center leading-none">
				<Counter
					value={normalizedValue}
					fontSize={sizeToFontSize[size]}
					horizontalPadding={0}
					gap={0}
					padding={0}
					gradientHeight={0}
				/>
			</span>
			<span className="ms-0.5 inline-flex items-center leading-none">{symbol}</span>
		</span>
	);
}
