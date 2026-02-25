import { Circle } from "lucide-react";
import { useTranslation } from "@offline-sqlite/i18n";
import { LOWER_ROW, UPPER_ROW } from "./tooth-data";

const ADULT_UPPER_TEETH = UPPER_ROW.map((t) => t.num.toString());
const ADULT_LOWER_TEETH = LOWER_ROW.map((t) => t.num.toString());

function isFullArchSelection(selectedTeeth: string[], archTeeth: string[]) {
	return archTeeth.every((tooth) => selectedTeeth.includes(tooth));
}

interface ToothBadgeProps {
	teeth: string[];
	onRemove?: (tooth: string) => void;
	maxTeeth?: number;
	variant?: "chips" | "summary";
	withIcon?: boolean;
}

export function ToothBadge({
	teeth,
	onRemove,
	maxTeeth,
	variant = "chips",
	withIcon = false,
}: ToothBadgeProps) {
	const { t } = useTranslation();

	if (teeth.length === 0) return null;

	if (variant === "summary") {
		let summaryText = teeth.join(", ");

		if (isFullArchSelection(teeth, ADULT_UPPER_TEETH)) {
			summaryText = t("teeth.upper");
		} else if (isFullArchSelection(teeth, ADULT_LOWER_TEETH)) {
			summaryText = t("teeth.lower");
		}

		return (
			<div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
				{withIcon && <Circle className="h-2.5 w-2.5" />}
				<span>{summaryText}</span>
			</div>
		);
	}

	const fullUpperSelected = isFullArchSelection(teeth, ADULT_UPPER_TEETH);
	const fullLowerSelected = isFullArchSelection(teeth, ADULT_LOWER_TEETH);
	const shouldCollapseToArchLabels = !onRemove && !maxTeeth && (fullUpperSelected || fullLowerSelected);

	if (shouldCollapseToArchLabels) {
		const archLabels = [
			...(fullUpperSelected ? [t("teeth.upper")] : []),
			...(fullLowerSelected ? [t("teeth.lower")] : []),
		];

		return (
			<div className="flex flex-wrap gap-1">
				{archLabels.map((label) => (
					<span
						key={label}
						className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2
							py-0.5 text-xs font-medium"
					>
						{label}
					</span>
				))}
			</div>
		);
	}

	const displayTeeth = maxTeeth ? teeth.slice(0, maxTeeth) : teeth;
	const remainingCount = maxTeeth ? teeth.length - maxTeeth : 0;

	return (
		<div className="flex flex-wrap gap-1">
			{displayTeeth.map((tooth) => (
				<span
					key={tooth}
					className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2
						py-0.5 text-xs font-medium"
				>
					{tooth}
					{onRemove && (
						<button
							type="button"
							onClick={() => onRemove(tooth)}
							className="text-primary/70 hover:text-primary transition-colors"
						>
							×
						</button>
					)}
				</span>
			))}
			{remainingCount > 0 && (
				<span
					className="bg-muted-foreground/10 text-muted-foreground inline-flex items-center gap-1
						rounded-full px-2 py-0.5 text-xs font-medium"
				>
					+{remainingCount}
				</span>
			)}
		</div>
	);
}
