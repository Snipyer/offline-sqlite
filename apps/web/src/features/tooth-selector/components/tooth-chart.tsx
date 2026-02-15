import { useMemo } from "react";

import {
	ADULT_SVG_SCALE,
	CHILD_SVG_SCALE,
	CHILD_UPPER_MOLAR_EXTRA_Y_OFFSET,
	CHILD_UPPER_ROW,
	CHILD_LOWER_ROW,
	LAYOUT,
	LOWER_ROW,
	UPPER_ROW,
	type ToothDef,
	getScaledSize,
} from "./tooth-data";

export type ToothChartMode = "display" | "select";

interface ToothChartProps {
	mode: ToothChartMode;
	highlightedTeeth?: string[];
	selectedTeeth?: string[];
	onToggle?: (toothId: string) => void;
	highlightColor?: string;
	showQuadrantLabels?: boolean;
	ariaLabel?: string;
}

interface PlacedTooth {
	def: ToothDef;
	x: number;
	y: number;
	labelX: number;
	labelY: number;
}

interface ToothSvgProps {
	tooth: PlacedTooth;
	scale: number;
	labelFontSize?: number;
	mode: ToothChartMode;
	isHighlighted: boolean;
	isSelected: boolean;
	highlightColor: string;
	onToggle?: (toothId: string) => void;
}

function ToothSvg({
	tooth,
	scale,
	labelFontSize = 9,
	mode,
	isHighlighted,
	isSelected,
	highlightColor,
	onToggle,
}: ToothSvgProps) {
	const { def, x, y, labelX, labelY } = tooth;
	const size = getScaledSize(def, scale);
	const toothId = def.num.toString();

	const isActive = mode === "select" ? isSelected : isHighlighted;
	const isOther = mode === "display" && isHighlighted;

	const opacity =
		mode === "select"
			? isSelected
				? 1
				: 0.72
			: isOther
				? isHighlighted
					? 1
					: 0.2
				: isHighlighted
					? 1
					: 0.5;

	const groupProps =
		mode === "select"
			? {
				onClick: () => onToggle?.(toothId),
				style: { cursor: "pointer" } as const,
				role: "button" as const,
				tabIndex: 0 as const,
				"aria-label": `Tooth ${def.num}`,
				"aria-pressed": isSelected,
				onKeyDown: (e: React.KeyboardEvent) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onToggle?.(toothId);
					}
				},
			}
			: {};

	const fillColor = mode === "select" ? "var(--primary)" : highlightColor;

	return (
		<g {...groupProps}>
			<g transform={`translate(${x}, ${y})`}>
				<rect x={-2} y={-2} width={size.w + 4} height={size.h + 4} fill="transparent" />

				{isActive && (
					<rect
						x={-2}
						y={-2}
						width={size.w + 4}
						height={size.h + 4}
						fill={fillColor}
						fillOpacity={0.5}
						rx={4}
					/>
				)}

				<g
					transform={def.mirrorX ? `translate(${size.w}, 0) scale(-1, 1)` : undefined}
					className="transition-opacity duration-200"
					opacity={opacity}
				>
					<image
						href={`/svg-teeth/${def.source}.svg`}
						x={0}
						y={0}
						width={size.w}
						height={size.h}
						preserveAspectRatio="xMidYMid meet"
					/>
				</g>
			</g>

			<text
				x={labelX}
				y={labelY}
				textAnchor="middle"
				dominantBaseline="central"
				fontSize={labelFontSize}
				fontWeight={isActive ? 700 : 400}
				fill={isActive ? fillColor : "var(--muted-foreground)"}
				className={
					mode === "select"
						? "transition-all duration-200 select-none"
						: "pointer-events-none transition-all duration-200 select-none"
				}
			>
				{def.num}
			</text>
		</g>
	);
}

export function ToothChart({
	mode,
	highlightedTeeth = [],
	selectedTeeth = [],
	onToggle,
	highlightColor = "var(--primary)",
	showQuadrantLabels = false,
	ariaLabel = "Teeth chart",
}: ToothChartProps) {
	const highlightedSet = useMemo(() => new Set(highlightedTeeth), [highlightedTeeth]);
	const selectedSet = useMemo(() => new Set(selectedTeeth), [selectedTeeth]);

	const adultUpperPlaced: PlacedTooth[] = UPPER_ROW.map((def, i) => {
		const size = getScaledSize(def, ADULT_SVG_SCALE);
		const col = LAYOUT.cols[i];
		return {
			def,
			x: col.x + (col.w - size.w) / 2,
			y: LAYOUT.upperBottomY - size.h,
			labelX: col.centerX,
			labelY: LAYOUT.upperLabelY,
		};
	});

	const adultLowerPlaced: PlacedTooth[] = LOWER_ROW.map((def, i) => {
		const size = getScaledSize(def, ADULT_SVG_SCALE);
		const col = LAYOUT.cols[i];
		return {
			def,
			x: col.x + (col.w - size.w) / 2,
			y: LAYOUT.lowerTopY,
			labelX: col.centerX,
			labelY: LAYOUT.lowerLabelY,
		};
	});

	const childUpperPlaced: PlacedTooth[] = CHILD_UPPER_ROW.map((def, i) => {
		const size = getScaledSize(def, CHILD_SVG_SCALE);
		const col = LAYOUT.childCols[i];
		const extraYOffset = [54, 55, 64, 65].includes(def.num) ? CHILD_UPPER_MOLAR_EXTRA_Y_OFFSET : 0;
		return {
			def,
			x: col.x + (col.w - size.w) / 2,
			y: LAYOUT.childUpperTopY + 3 + extraYOffset,
			labelX: col.centerX,
			labelY: LAYOUT.childUpperLabelY,
		};
	});

	const childLowerPlaced: PlacedTooth[] = CHILD_LOWER_ROW.map((def, i) => {
		const size = getScaledSize(def, CHILD_SVG_SCALE);
		const col = LAYOUT.childCols[i];
		return {
			def,
			x: col.x + (col.w - size.w) / 2,
			y: LAYOUT.childLowerTopY,
			labelX: col.centerX,
			labelY: LAYOUT.childLowerLabelY,
		};
	});

	return (
		<svg
			viewBox={`0 0 ${LAYOUT.totalWidth} ${LAYOUT.totalHeight}`}
			width="100%"
			className="mx-auto"
			aria-label={ariaLabel}
		>
			<line
				x1={16}
				y1={LAYOUT.dividerY}
				x2={LAYOUT.totalWidth - 16}
				y2={LAYOUT.dividerY}
				stroke="var(--border)"
				strokeWidth={1}
			/>

			<line
				x1={LAYOUT.midlineX}
				y1={10}
				x2={LAYOUT.midlineX}
				y2={LAYOUT.totalHeight - 10}
				stroke="var(--border)"
				strokeWidth={1}
			/>

			{showQuadrantLabels && (
				<>
					<text
						x={16 + 6}
						y={10 + 8}
						textAnchor="start"
						dominantBaseline="central"
						fontSize={8}
						fill="var(--muted-foreground)"
						fillOpacity={0.5}
						className="select-none"
					>
						Q1
					</text>
					<text
						x={LAYOUT.totalWidth - 16 - 6}
						y={10 + 8}
						textAnchor="end"
						dominantBaseline="central"
						fontSize={8}
						fill="var(--muted-foreground)"
						fillOpacity={0.5}
						className="select-none"
					>
						Q2
					</text>
					<text
						x={16 + 6}
						y={LAYOUT.totalHeight - 10 - 8}
						textAnchor="start"
						dominantBaseline="central"
						fontSize={8}
						fill="var(--muted-foreground)"
						fillOpacity={0.5}
						className="select-none"
					>
						Q4
					</text>
					<text
						x={LAYOUT.totalWidth - 16 - 6}
						y={LAYOUT.totalHeight - 10 - 8}
						textAnchor="end"
						dominantBaseline="central"
						fontSize={8}
						fill="var(--muted-foreground)"
						fillOpacity={0.5}
						className="select-none"
					>
						Q3
					</text>
				</>
			)}

			{adultUpperPlaced.map((tooth) => (
				<ToothSvg
					key={tooth.def.num}
					tooth={tooth}
					scale={ADULT_SVG_SCALE}
					mode={mode}
					isHighlighted={highlightedSet.has(tooth.def.num.toString())}
					isSelected={selectedSet.has(tooth.def.num.toString())}
					highlightColor={highlightColor}
					onToggle={onToggle}
				/>
			))}

			{childUpperPlaced.map((tooth) => (
				<ToothSvg
					key={tooth.def.num}
					tooth={tooth}
					scale={CHILD_SVG_SCALE}
					labelFontSize={mode === "select" ? 8 : 6}
					mode={mode}
					isHighlighted={highlightedSet.has(tooth.def.num.toString())}
					isSelected={selectedSet.has(tooth.def.num.toString())}
					highlightColor={highlightColor}
					onToggle={onToggle}
				/>
			))}

			{childLowerPlaced.map((tooth) => (
				<ToothSvg
					key={tooth.def.num}
					tooth={tooth}
					scale={CHILD_SVG_SCALE}
					labelFontSize={mode === "select" ? 8 : 6}
					mode={mode}
					isHighlighted={highlightedSet.has(tooth.def.num.toString())}
					isSelected={selectedSet.has(tooth.def.num.toString())}
					highlightColor={highlightColor}
					onToggle={onToggle}
				/>
			))}

			{adultLowerPlaced.map((tooth) => (
				<ToothSvg
					key={tooth.def.num}
					tooth={tooth}
					scale={ADULT_SVG_SCALE}
					mode={mode}
					isHighlighted={highlightedSet.has(tooth.def.num.toString())}
					isSelected={selectedSet.has(tooth.def.num.toString())}
					highlightColor={highlightColor}
					onToggle={onToggle}
				/>
			))}
		</svg>
	);
}
