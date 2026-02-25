import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate, useTranslation } from "@offline-sqlite/i18n";

interface DateRangePickerProps {
	value: DateRange | undefined;
	onChange: (value: DateRange | undefined) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
	const { t } = useTranslation();

	const buttonLabel = (() => {
		if (!value?.from) {
			return t("listFilters.selectDateRange");
		}

		if (!value.to) {
			return formatDate(value.from.getTime());
		}

		return `${formatDate(value.from.getTime())} - ${formatDate(value.to.getTime())}`;
	})();

	return (
		<Popover>
			<PopoverTrigger className="w-full">
				<div
					className="border-input bg-background hover:bg-muted hover:text-foreground
						dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted
						aria-expanded:text-foreground focus-visible:ring-ring/50 flex h-8 w-full
						cursor-pointer items-center justify-start gap-2 rounded-none border px-3 text-left
						text-sm font-normal outline-none focus-visible:ring-1"
				>
					<CalendarIcon className="h-4 w-4" />
					<span className={!value?.from ? "text-muted-foreground" : undefined}>{buttonLabel}</span>
				</div>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="range"
					selected={value}
					onSelect={(range) => onChange(range ?? undefined)}
					numberOfMonths={2}
					captionLayout="dropdown"
				/>
			</PopoverContent>
		</Popover>
	);
}
