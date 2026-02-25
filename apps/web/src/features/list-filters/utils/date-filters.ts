import type { DateRange } from "react-day-picker";

export type DatePreset = "yesterday" | "lastWeek" | "lastMonth";

function atStartOfDay(date: Date) {
	const next = new Date(date);
	next.setHours(0, 0, 0, 0);
	return next;
}

function atEndOfDay(date: Date) {
	const next = new Date(date);
	next.setHours(23, 59, 59, 999);
	return next;
}

function subtractDays(date: Date, days: number) {
	const next = new Date(date);
	next.setDate(next.getDate() - days);
	return next;
}

export function getPresetDateRange(preset: DatePreset): DateRange {
	const now = new Date();

	if (preset === "yesterday") {
		const yesterday = subtractDays(now, 1);
		return {
			from: atStartOfDay(yesterday),
			to: atEndOfDay(yesterday),
		};
	}

	if (preset === "lastWeek") {
		return {
			from: atStartOfDay(subtractDays(now, 6)),
			to: atEndOfDay(now),
		};
	}

	return {
		from: atStartOfDay(subtractDays(now, 29)),
		to: atEndOfDay(now),
	};
}

export function toTimestampRange(range: DateRange | undefined) {
	if (!range?.from) {
		return {
			dateFrom: undefined,
			dateTo: undefined,
		};
	}

	const from = atStartOfDay(range.from).getTime();
	const toDate = range.to ?? range.from;
	const to = atEndOfDay(toDate).getTime();

	return {
		dateFrom: from,
		dateTo: to,
	};
}

export function fromTimestampsToDateRange(dateFrom?: number, dateTo?: number): DateRange | undefined {
	if (dateFrom === undefined && dateTo === undefined) {
		return undefined;
	}

	if (dateFrom !== undefined && dateTo !== undefined) {
		return {
			from: new Date(dateFrom),
			to: new Date(dateTo),
		};
	}

	const single = dateFrom ?? dateTo;
	if (single === undefined) {
		return undefined;
	}

	const singleDate = new Date(single);
	return {
		from: singleDate,
		to: singleDate,
	};
}
