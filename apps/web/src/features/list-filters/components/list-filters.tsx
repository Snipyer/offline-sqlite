import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/features/list-filters/components/date-range-picker";
import { type DatePreset, getPresetDateRange } from "@/features/list-filters/utils/date-filters";
import { useTranslation } from "@offline-sqlite/i18n";

interface ListFiltersProps {
	searchValue: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder: string;
	datePreset: DatePreset | null;
	onDatePresetChange: (preset: DatePreset | null) => void;
	dateRange: DateRange | undefined;
	onDateRangeChange: (range: DateRange | undefined) => void;
	hasActiveFilters: boolean;
	onClearFilters: () => void;
	moreFilters?: ReactNode;
}

const DATE_PRESETS: DatePreset[] = ["yesterday", "lastWeek", "lastMonth"];

export function ListFilters({
	searchValue,
	onSearchChange,
	searchPlaceholder,
	datePreset,
	onDatePresetChange,
	dateRange,
	onDateRangeChange,
	hasActiveFilters,
	onClearFilters,
	moreFilters,
}: ListFiltersProps) {
	const { t } = useTranslation();
	const [showMore, setShowMore] = useState(false);

	const handlePresetSelect = (preset: DatePreset) => {
		if (datePreset === preset) {
			onDatePresetChange(null);
			onDateRangeChange(undefined);
			return;
		}

		onDatePresetChange(preset);
		onDateRangeChange(getPresetDateRange(preset));
	};

	const handleDateRangeChange = (range: DateRange | undefined) => {
		onDatePresetChange(null);
		onDateRangeChange(range);
	};

	return (
		<div className="mb-6 space-y-4 rounded-xl bg-transparent">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					{DATE_PRESETS.map((preset) => (
						<Button
							key={preset}
							variant={datePreset === preset ? "default" : "outline"}
							size="sm"
							onClick={() => handlePresetSelect(preset)}
						>
							{t(`listFilters.${preset}`)}
						</Button>
					))}
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={() => setShowMore((value) => !value)}>
						{showMore ? t("listFilters.showLess") : t("listFilters.showMore")}
					</Button>
					{hasActiveFilters && (
						<Button variant="ghost" size="sm" onClick={onClearFilters}>
							{t("listFilters.clearFilters")}
						</Button>
					)}
				</div>
			</div>

			<div className="relative">
				<Search
					className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4
						-translate-y-1/2"
				/>
				<Input
					value={searchValue}
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder={searchPlaceholder}
					className="min-h-12 pl-9"
				/>
			</div>

			{showMore && (
				<div className="space-y-3 pt-1">
					{/* <Label className="text-sm">{t("listFilters.moreFilters")}</Label> */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div className="col-span-1">
							<Label className="text-sm font-light">{t("listFilters.dateRange")}</Label>
							<div className="mt-1.5">
								<DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
							</div>
						</div>
						{moreFilters}
					</div>
				</div>
			)}
		</div>
	);
}
