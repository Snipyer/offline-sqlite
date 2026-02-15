import { useMemo } from "react";

interface ToothDisplayProps {
	highlightedTeeth: string[];
	highlightColor?: string;
	hovered?: boolean;
	otherHovered?: boolean;
}

interface ToothDef {
	num: number;
	source: number;
	mirrorX?: boolean;
	isLower: boolean;
}

const TOOTH_SVG_SIZES: Record<number, { w: number; h: number }> = {
	21: { w: 176, h: 500 },
	22: { w: 120, h: 464 },
	23: { w: 134, h: 549 },
	24: { w: 139, h: 465 },
	25: { w: 144, h: 454 },
	26: { w: 195, h: 422 },
	27: { w: 185, h: 390 },
	28: { w: 162, h: 379 },
	31: { w: 156, h: 376 },
	32: { w: 124, h: 459 },
	33: { w: 144, h: 555 },
	34: { w: 142, h: 454 },
	35: { w: 146, h: 466 },
	36: { w: 224, h: 452 },
	37: { w: 199, h: 409 },
	38: { w: 174, h: 361 },
	61: { w: 136, h: 320 },
	62: { w: 111, h: 320 },
	63: { w: 129, h: 361 },
	64: { w: 174, h: 284 },
	65: { w: 187, h: 305 },
	71: { w: 91, h: 318 },
	72: { w: 100, h: 318 },
	73: { w: 130, h: 347 },
	74: { w: 197, h: 306 },
	75: { w: 204, h: 316 },
};

const UPPER_RIGHT: ToothDef[] = [
	{ num: 18, source: 28, mirrorX: true, isLower: false },
	{ num: 17, source: 27, mirrorX: true, isLower: false },
	{ num: 16, source: 26, mirrorX: true, isLower: false },
	{ num: 15, source: 25, mirrorX: true, isLower: false },
	{ num: 14, source: 24, mirrorX: true, isLower: false },
	{ num: 13, source: 23, mirrorX: true, isLower: false },
	{ num: 12, source: 22, mirrorX: true, isLower: false },
	{ num: 11, source: 21, mirrorX: true, isLower: false },
];

const UPPER_LEFT: ToothDef[] = [
	{ num: 21, source: 21, isLower: false },
	{ num: 22, source: 22, isLower: false },
	{ num: 23, source: 23, isLower: false },
	{ num: 24, source: 24, isLower: false },
	{ num: 25, source: 25, isLower: false },
	{ num: 26, source: 26, isLower: false },
	{ num: 27, source: 27, isLower: false },
	{ num: 28, source: 28, isLower: false },
];

const LOWER_RIGHT: ToothDef[] = [
	{ num: 48, source: 38, mirrorX: true, isLower: true },
	{ num: 47, source: 37, mirrorX: true, isLower: true },
	{ num: 46, source: 36, mirrorX: true, isLower: true },
	{ num: 45, source: 35, mirrorX: true, isLower: true },
	{ num: 44, source: 34, mirrorX: true, isLower: true },
	{ num: 43, source: 33, mirrorX: true, isLower: true },
	{ num: 42, source: 32, mirrorX: true, isLower: true },
	{ num: 41, source: 31, mirrorX: true, isLower: true },
];

const LOWER_LEFT: ToothDef[] = [
	{ num: 31, source: 31, isLower: true },
	{ num: 32, source: 32, isLower: true },
	{ num: 33, source: 33, isLower: true },
	{ num: 34, source: 34, isLower: true },
	{ num: 35, source: 35, isLower: true },
	{ num: 36, source: 36, isLower: true },
	{ num: 37, source: 37, isLower: true },
	{ num: 38, source: 38, isLower: true },
];

const UPPER_ROW = [...UPPER_RIGHT, ...UPPER_LEFT];
const LOWER_ROW = [...LOWER_RIGHT, ...LOWER_LEFT];

const CHILD_UPPER_RIGHT: ToothDef[] = [
	{ num: 55, source: 65, mirrorX: true, isLower: false },
	{ num: 54, source: 64, mirrorX: true, isLower: false },
	{ num: 53, source: 63, mirrorX: true, isLower: false },
	{ num: 52, source: 62, mirrorX: true, isLower: false },
	{ num: 51, source: 61, mirrorX: true, isLower: false },
];

const CHILD_UPPER_LEFT: ToothDef[] = [
	{ num: 61, source: 61, isLower: false },
	{ num: 62, source: 62, isLower: false },
	{ num: 63, source: 63, isLower: false },
	{ num: 64, source: 64, isLower: false },
	{ num: 65, source: 65, isLower: false },
];

const CHILD_LOWER_RIGHT: ToothDef[] = [
	{ num: 85, source: 75, mirrorX: true, isLower: true },
	{ num: 84, source: 74, mirrorX: true, isLower: true },
	{ num: 83, source: 73, mirrorX: true, isLower: true },
	{ num: 82, source: 72, mirrorX: true, isLower: true },
	{ num: 81, source: 71, mirrorX: true, isLower: true },
];

const CHILD_LOWER_LEFT: ToothDef[] = [
	{ num: 71, source: 71, isLower: true },
	{ num: 72, source: 72, isLower: true },
	{ num: 73, source: 73, isLower: true },
	{ num: 74, source: 74, isLower: true },
	{ num: 75, source: 75, isLower: true },
];

const CHILD_UPPER_ROW = [...CHILD_UPPER_RIGHT, ...CHILD_UPPER_LEFT];
const CHILD_LOWER_ROW = [...CHILD_LOWER_RIGHT, ...CHILD_LOWER_LEFT];

const ADULT_SVG_SCALE = 0.12;
const CHILD_SVG_SCALE = 0.1;
const GAP = 2;
const CENTER_GAP = 3;
const CHILD_GAP = 3;
const CHILD_CENTER_GAP = 5;
const CHILD_UPPER_SVG_Y_OFFSET = 3;
const CHILD_UPPER_MOLAR_EXTRA_Y_OFFSET = 6;
const MARGIN_X = 16;
const MARGIN_Y = 10;
const LABEL_OFFSET = 16;

function getScaledSize(def: ToothDef, scale: number) {
	const source = TOOTH_SVG_SIZES[def.source];
	return {
		w: Math.round(source.w * scale),
		h: Math.round(source.h * scale),
	};
}

function computeLayout() {
	const cols: { x: number; w: number; centerX: number }[] = [];
	let x = MARGIN_X;

	for (let i = 0; i < UPPER_ROW.length; i++) {
		if (i === 8) x += CENTER_GAP;
		const uw = getScaledSize(UPPER_ROW[i], ADULT_SVG_SCALE).w;
		const lw = getScaledSize(LOWER_ROW[i], ADULT_SVG_SCALE).w;
		const w = Math.max(uw, lw);
		cols.push({ x, w, centerX: x + w / 2 });
		x += w + GAP;
	}

	const totalWidth = x - GAP + MARGIN_X;
	const maxUpperH = Math.max(...UPPER_ROW.map((tooth) => getScaledSize(tooth, ADULT_SVG_SCALE).h));
	const maxLowerH = Math.max(...LOWER_ROW.map((tooth) => getScaledSize(tooth, ADULT_SVG_SCALE).h));
	const maxChildUpperH = Math.max(
		...CHILD_UPPER_ROW.map((tooth) => getScaledSize(tooth, CHILD_SVG_SCALE).h),
	);
	const maxChildLowerH = Math.max(
		...CHILD_LOWER_ROW.map((tooth) => getScaledSize(tooth, CHILD_SVG_SCALE).h),
	);

	const childWidths = CHILD_UPPER_ROW.map((_, i) => {
		const uw = getScaledSize(CHILD_UPPER_ROW[i], CHILD_SVG_SCALE).w;
		const lw = getScaledSize(CHILD_LOWER_ROW[i], CHILD_SVG_SCALE).w;
		return Math.max(uw, lw);
	});

	const childTotalWidth =
		childWidths.reduce((sum, current) => sum + current, 0) +
		CHILD_GAP * (childWidths.length - 1) +
		CHILD_CENTER_GAP;

	const midlineX = (cols[7].x + cols[7].w + cols[8].x) / 2;
	let childX = midlineX - childTotalWidth / 2;
	const childCols: { x: number; w: number; centerX: number }[] = [];

	for (let i = 0; i < childWidths.length; i++) {
		if (i === 5) childX += CHILD_CENTER_GAP;
		const w = childWidths[i];
		childCols.push({ x: childX, w, centerX: childX + w / 2 });
		childX += w + CHILD_GAP;
	}

	const upperBottomY = MARGIN_Y + maxUpperH;
	const upperLabelY = upperBottomY + LABEL_OFFSET;
	const childUpperTopY = upperLabelY + 6;
	const childUpperLabelY = childUpperTopY + maxChildUpperH + 9;
	const dividerY = childUpperLabelY + 6;
	const childLowerLabelY = dividerY + 12;
	const childLowerTopY = childLowerLabelY + 6;
	const lowerLabelY = childLowerTopY + maxChildLowerH + LABEL_OFFSET;
	const lowerTopY = lowerLabelY + 8;
	const totalHeight = lowerTopY + maxLowerH + MARGIN_Y;

	return {
		cols,
		childCols,
		totalWidth,
		totalHeight,
		upperBottomY,
		upperLabelY,
		childUpperTopY,
		childUpperLabelY,
		dividerY,
		childLowerLabelY,
		childLowerTopY,
		lowerLabelY,
		lowerTopY,
		midlineX,
	};
}

const LAYOUT = computeLayout();

interface ToothSvgDisplayProps {
	def: ToothDef;
	x: number;
	y: number;
	labelX: number;
	labelY: number;
	scale: number;
	labelFontSize?: number;
	isHighlighted: boolean;
	highlightColor: string;
	isOther: boolean;
}

function ToothSvgDisplay({
	def,
	x,
	y,
	labelX,
	labelY,
	scale,
	labelFontSize = 7,
	isHighlighted,
	highlightColor,
	isOther,
}: ToothSvgDisplayProps) {
	const size = getScaledSize(def, scale);

	const opacity = isOther && !isHighlighted ? 0.2 : isOther && isHighlighted ? 1 : isHighlighted ? 1 : 0.5;

	return (
		<g>
			<g transform={`translate(${x}, ${y})`}>
				<rect x={-2} y={-2} width={size.w + 4} height={size.h + 4} fill="transparent" />

				{isHighlighted && (
					<rect
						x={-2}
						y={-2}
						width={size.w + 4}
						height={size.h + 4}
						fill={highlightColor}
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
				fontWeight={isHighlighted ? 700 : 400}
				fill={isHighlighted ? highlightColor : "var(--muted-foreground)"}
				className="pointer-events-none transition-all duration-200 select-none"
			>
				{def.num}
			</text>
		</g>
	);
}

export function ToothDisplay({
	highlightedTeeth,
	highlightColor = "var(--primary)",
	hovered,
	otherHovered,
}: ToothDisplayProps) {
	const highlightedSet = useMemo(() => new Set(highlightedTeeth), [highlightedTeeth]);
	const isOther = otherHovered ?? false;

	const adultUpperPlaced = UPPER_ROW.map((def, i) => {
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

	const adultLowerPlaced = LOWER_ROW.map((def, i) => {
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

	const childUpperPlaced = CHILD_UPPER_ROW.map((def, i) => {
		const size = getScaledSize(def, CHILD_SVG_SCALE);
		const col = LAYOUT.childCols[i];
		const extraYOffset = [54, 55, 64, 65].includes(def.num) ? CHILD_UPPER_MOLAR_EXTRA_Y_OFFSET : 0;
		return {
			def,
			x: col.x + (col.w - size.w) / 2,
			y: LAYOUT.childUpperTopY + CHILD_UPPER_SVG_Y_OFFSET + extraYOffset,
			labelX: col.centerX,
			labelY: LAYOUT.childUpperLabelY,
		};
	});

	const childLowerPlaced = CHILD_LOWER_ROW.map((def, i) => {
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
			aria-label="Teeth chart"
		>
			<line
				x1={MARGIN_X}
				y1={LAYOUT.dividerY}
				x2={LAYOUT.totalWidth - MARGIN_X}
				y2={LAYOUT.dividerY}
				stroke="var(--border)"
				strokeWidth={1}
			/>

			<line
				x1={LAYOUT.midlineX}
				y1={MARGIN_Y}
				x2={LAYOUT.midlineX}
				y2={LAYOUT.totalHeight - MARGIN_Y}
				stroke="var(--border)"
				strokeWidth={1}
			/>

			{adultUpperPlaced.map((tooth) => (
				<ToothSvgDisplay
					key={tooth.def.num}
					def={tooth.def}
					x={tooth.x}
					y={tooth.y}
					labelX={tooth.labelX}
					labelY={tooth.labelY}
					scale={ADULT_SVG_SCALE}
					isHighlighted={highlightedSet.has(tooth.def.num.toString())}
					highlightColor={highlightColor}
					isOther={isOther}
				/>
			))}

			{childUpperPlaced.map((tooth) => (
				<ToothSvgDisplay
					key={tooth.def.num}
					def={tooth.def}
					x={tooth.x}
					y={tooth.y}
					labelX={tooth.labelX}
					labelY={tooth.labelY}
					scale={CHILD_SVG_SCALE}
					labelFontSize={6}
					isHighlighted={highlightedSet.has(tooth.def.num.toString())}
					highlightColor={highlightColor}
					isOther={isOther}
				/>
			))}

			{childLowerPlaced.map((tooth) => (
				<ToothSvgDisplay
					key={tooth.def.num}
					def={tooth.def}
					x={tooth.x}
					y={tooth.y}
					labelX={tooth.labelX}
					labelY={tooth.labelY}
					scale={CHILD_SVG_SCALE}
					labelFontSize={6}
					isHighlighted={highlightedSet.has(tooth.def.num.toString())}
					highlightColor={highlightColor}
					isOther={isOther}
				/>
			))}

			{adultLowerPlaced.map((tooth) => (
				<ToothSvgDisplay
					key={tooth.def.num}
					def={tooth.def}
					x={tooth.x}
					y={tooth.y}
					labelX={tooth.labelX}
					labelY={tooth.labelY}
					scale={ADULT_SVG_SCALE}
					isHighlighted={highlightedSet.has(tooth.def.num.toString())}
					highlightColor={highlightColor}
					isOther={isOther}
				/>
			))}
		</svg>
	);
}
