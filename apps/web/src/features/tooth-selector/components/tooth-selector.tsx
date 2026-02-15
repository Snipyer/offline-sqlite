import { useCallback, useState } from "react";

import { useTranslation } from "@offline-sqlite/i18n";

import { ToothChart } from "./tooth-chart";

interface ToothSelectorProps {
	selectedTeeth: string[];
	onChange: (teeth: string[]) => void;
	maxSelection?: number;
}

export function ToothSelector({ selectedTeeth, onChange, maxSelection }: ToothSelectorProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	const toggleTooth = useCallback(
		(toothId: string) => {
			if (selectedTeeth.includes(toothId)) {
				onChange(selectedTeeth.filter((id) => id !== toothId));
			} else {
				if (maxSelection && selectedTeeth.length >= maxSelection) return;
				onChange([...selectedTeeth, toothId]);
			}
		},
		[selectedTeeth, onChange, maxSelection],
	);

	return (
		<>
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="border-border hover:border-primary hover:text-primary w-full rounded-md border
						border-dashed px-2 py-1.5 text-sm transition-colors"
				>
					{selectedTeeth.length > 0
						? t("teeth.teethSelected", { count: selectedTeeth.length })
						: t("visits.selectTeeth")}
				</button>
				{selectedTeeth.length > 0 && (
					<button
						type="button"
						onClick={() => onChange([])}
						className="text-muted-foreground hover:text-destructive text-xs transition-colors"
					>
						{t("common.cancel")}
					</button>
				)}
			</div>

			{isOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					onClick={(e) => {
						if (e.target === e.currentTarget) setIsOpen(false);
					}}
					onKeyDown={(e) => {
						if (e.key === "Escape") setIsOpen(false);
					}}
					role="dialog"
					aria-modal="true"
					aria-label={t("visits.selectTeeth")}
				>
					<div
						className="bg-card animate-in fade-in zoom-in-95 w-full max-w-2xl rounded-xl border
							p-5 shadow-2xl"
					>
						<ToothChart
							mode="select"
							selectedTeeth={selectedTeeth}
							onToggle={toggleTooth}
							showQuadrantLabels
							ariaLabel={t("visits.selectTeeth")}
						/>

						<div className="mt-4 flex items-center justify-between border-t pt-3">
							<span className="text-muted-foreground text-sm">
								{selectedTeeth.length > 0
									? t("teeth.teethSelected", { count: selectedTeeth.length })
									: t("visits.selectTeeth")}
							</span>
							<div className="flex items-center gap-3">
								{selectedTeeth.length > 0 && (
									<button
										type="button"
										onClick={() => onChange([])}
										className="text-muted-foreground hover:text-destructive text-sm
											transition-colors"
									>
										{t("common.clear")}
									</button>
								)}
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									className="bg-primary text-primary-foreground hover:bg-primary/90
										rounded-md px-5 py-2 text-sm font-medium transition-colors"
								>
									{t("teeth.done", { count: selectedTeeth.length })}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export function ToothBadge({ teeth, onRemove }: { teeth: string[]; onRemove?: (tooth: string) => void }) {
	if (teeth.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-1">
			{teeth.map((tooth) => (
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
		</div>
	);
}
