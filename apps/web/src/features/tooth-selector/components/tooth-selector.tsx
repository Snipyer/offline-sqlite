import { useState } from "react";

interface ToothSelectorProps {
	selectedTeeth: string[];
	onChange: (teeth: string[]) => void;
	maxSelection?: number;
}

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

interface SingleToothProps {
	num: number;
	selectedTeeth: string[];
	onToggle: (id: string) => void;
}

function SingleTooth({ num, selectedTeeth, onToggle }: SingleToothProps) {
	const toothId = num.toString();
	const isSelected = selectedTeeth.includes(toothId);
	return (
		<button
			type="button"
			onClick={() => onToggle(toothId)}
			className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium
				transition-all ${
					isSelected
						? "border-primary bg-primary text-primary-foreground"
						: "border-border bg-background hover:border-primary/50"
				}`}
		>
			{num}
		</button>
	);
}

export function ToothSelector({ selectedTeeth, onChange, maxSelection }: ToothSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);

	const toggleTooth = (toothId: string) => {
		if (selectedTeeth.includes(toothId)) {
			onChange(selectedTeeth.filter((t) => t !== toothId));
		} else {
			if (maxSelection && selectedTeeth.length >= maxSelection) return;
			onChange([...selectedTeeth, toothId]);
		}
	};

	if (!isOpen) {
		return (
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="border-border hover:border-primary hover:text-primary rounded-md border
						border-dashed px-4 py-2 text-sm"
				>
					{selectedTeeth.length > 0 ? `${selectedTeeth.length} teeth selected` : "Select Teeth"}
				</button>
				{selectedTeeth.length > 0 && (
					<button
						type="button"
						onClick={() => onChange([])}
						className="text-muted-foreground hover:text-destructive text-xs"
					>
						Clear
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="rounded-md border p-4">
			<div className="relative h-48 w-full">
				<div className="absolute top-4 left-1/2 -translate-x-1/2">
					<div className="flex items-center gap-2">
						<div className="flex gap-1">
							{UPPER_RIGHT.map((num) => (
								<SingleTooth
									key={num}
									num={num}
									selectedTeeth={selectedTeeth}
									onToggle={toggleTooth}
								/>
							))}
						</div>
						<span className="text-muted-foreground text-xs">Upper</span>
						<div className="flex gap-1">
							{UPPER_LEFT.map((num) => (
								<SingleTooth
									key={num}
									num={num}
									selectedTeeth={selectedTeeth}
									onToggle={toggleTooth}
								/>
							))}
						</div>
					</div>
				</div>

				<div
					className="bg-border absolute top-1/2 left-1/2 h-px w-3/4 -translate-x-1/2
						-translate-y-1/2"
				/>

				<div className="absolute bottom-4 left-1/2 -translate-x-1/2">
					<div className="flex items-center gap-2">
						<div className="flex gap-1">
							{LOWER_LEFT.map((num) => (
								<SingleTooth
									key={num}
									num={num}
									selectedTeeth={selectedTeeth}
									onToggle={toggleTooth}
								/>
							))}
						</div>
						<span className="text-muted-foreground text-xs">Lower</span>
						<div className="flex gap-1">
							{LOWER_RIGHT.map((num) => (
								<SingleTooth
									key={num}
									num={num}
									selectedTeeth={selectedTeeth}
									onToggle={toggleTooth}
								/>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="mt-4 flex justify-end">
				<button
					type="button"
					onClick={() => setIsOpen(false)}
					className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2
						text-sm"
				>
					Done ({selectedTeeth.length} selected)
				</button>
			</div>
		</div>
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
							className="text-primary/70 hover:text-primary"
						>
							×
						</button>
					)}
				</span>
			))}
		</div>
	);
}
