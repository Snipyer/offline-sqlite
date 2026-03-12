import { Syringe, Receipt } from "lucide-react";
import { useTranslation } from "@offline-sqlite/i18n";

interface TypeEmptyStateProps {
	type: "visit" | "expense";
}

export function TypeEmptyState({ type }: TypeEmptyStateProps) {
	const { t } = useTranslation();
	const Icon = type === "visit" ? Syringe : Receipt;

	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="bg-muted/50 mb-4 flex h-20 w-20 items-center justify-center rounded-3xl">
				<Icon className="text-muted-foreground/50 h-10 w-10" />
			</div>
			<p className="text-muted-foreground text-sm">{t(`${type}Types.empty`)}</p>
		</div>
	);
}
