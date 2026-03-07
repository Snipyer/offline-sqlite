import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, ChartNoAxesCombined } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@offline-sqlite/i18n";
import { pageContainerVariants, pageItemVariants } from "@/lib/animations";
import { motion } from "motion/react";
import { FinancialTab } from "./financial-tab";
import { AnalyticsTab } from "./analytics-tab";
import { DateRangePicker } from "@/features/list-filters/components/date-range-picker";
import { getPresetDateRange } from "@/features/list-filters/utils/date-filters";
import type { DateRange } from "react-day-picker";

type DatePreset = "thisMonth" | "lastWeek" | "lastMonth";

const DATE_PRESETS: DatePreset[] = ["lastWeek", "lastMonth", "thisMonth"];

function toDateKey(date: Date) {
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getMatchingPreset(range: DateRange | undefined): DatePreset | undefined {
	if (!range?.from || !range?.to) {
		return undefined;
	}

	const selectedFrom = toDateKey(range.from);
	const selectedTo = toDateKey(range.to);

	for (const preset of DATE_PRESETS) {
		const presetRange = getPresetDateRange(preset);
		if (!presetRange.from || !presetRange.to) {
			continue;
		}

		if (toDateKey(presetRange.from) === selectedFrom && toDateKey(presetRange.to) === selectedTo) {
			return preset;
		}
	}

	return undefined;
}

function getDefaultDateRange(): DateRange {
	const now = new Date();
	const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	return { from: firstDayOfMonth, to: now };
}

export default function ReportsPage() {
	const { t } = useTranslation();
	const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultDateRange);
	const [datePreset, setDatePreset] = useState<DatePreset | undefined>("thisMonth");
	const [activeTab, setActiveTab] = useState<"financial" | "analytics">("financial");

	const handlePresetSelect = (preset: DatePreset) => {
		if (datePreset === preset) return;
		setDatePreset(preset);
		setDateRange(getPresetDateRange(preset));
	};

	const handleDateRangeChange = (range: DateRange | undefined) => {
		setDateRange(range);
		setDatePreset(getMatchingPreset(range));
	};

	const dateRangeParams = useMemo(() => {
		if (!dateRange?.from || !dateRange?.to) {
			return {
				startDate: new Date(0).toISOString(),
				endDate: new Date().toISOString(),
			};
		}
		return {
			startDate: dateRange.from.toISOString(),
			endDate: dateRange.to.toISOString(),
		};
	}, [dateRange]);

	return (
		<motion.div
			variants={pageContainerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-6xl px-4 py-8"
		>
			<motion.div variants={pageItemVariants} className="mb-8">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex items-center gap-3">
						<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
							<TrendingUp className="text-primary h-6 w-6" />
						</div>
						<div>
							<h1 className="text-2xl font-semibold tracking-tight">{t("reports.title")}</h1>
							<p className="text-muted-foreground text-sm">{t("reports.subtitle")}</p>
						</div>
					</div>
					<div className="flex flex-col items-end gap-2">
						<div className="flex items-center gap-1">
							{DATE_PRESETS.map((preset) => (
								<Button
									key={preset}
									variant={datePreset === preset ? "default" : "outline"}
									onClick={() => handlePresetSelect(preset)}
								>
									{t(`listFilters.${preset}`)}
								</Button>
							))}
							<DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
						</div>
					</div>
				</div>
			</motion.div>

			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as "financial" | "analytics")}
			>
				<div className="border-border/50 mb-2 border-b">
					<TabsList variant="line" className="h-10">
						<TabsTrigger value="financial">
							<DollarSign className="h-4 w-4" />
							{t("reports.financial")}
						</TabsTrigger>
						<TabsTrigger value="analytics">
							<ChartNoAxesCombined className="h-4 w-4" />
							{t("reports.analytics")}
						</TabsTrigger>
					</TabsList>
				</div>

				{activeTab === "financial" && <FinancialTab dateRange={dateRangeParams} />}
				{activeTab === "analytics" && <AnalyticsTab dateRange={dateRangeParams} />}
			</Tabs>
		</motion.div>
	);
}
