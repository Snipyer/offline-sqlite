import { ToothChart } from "./tooth-chart";

interface ToothDisplayProps {
	highlightedTeeth: string[];
	highlightColor?: string;
	hovered?: boolean;
	otherHovered?: boolean;
}

export function ToothDisplay({ highlightedTeeth, highlightColor = "var(--primary)" }: ToothDisplayProps) {
	return (
		<ToothChart
			mode="display"
			highlightedTeeth={highlightedTeeth}
			highlightColor={highlightColor}
			ariaLabel="Teeth chart"
		/>
	);
}
