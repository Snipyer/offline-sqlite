import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListFilters } from "@/features/list-filters/components/list-filters";
import { MultiSelectDropdown } from "@/features/list-filters/components/multi-select-dropdown";
import { type DatePreset } from "@/features/list-filters/utils/date-filters";
import { getEntityColor } from "@/utils/entity-colors";
import { useTranslation } from "@offline-sqlite/i18n";

interface ExpenseType {
	id: string;
	name: string;
}

type SortOption = "dateDesc" | "dateAsc" | "amountDesc" | "amountAsc" | "typeAsc" | "typeDesc";

interface ExpenseFiltersProps {
	query: string;
	setQuery: (value: string) => void;
	filterTypeIds: string[];
	setFilterTypeIds: (value: string[]) => void;
	dateFrom: string;
	setDateFrom: (value: string) => void;
	dateTo: string;
	setDateTo: (value: string) => void;
	sortBy: SortOption;
	setSortBy: (value: SortOption) => void;
	expenseTypes: ExpenseType[];
	hasActiveFilters: boolean;
	onClearFilters: () => void;
}

export function ExpenseFilters({
	query,
	setQuery,
	filterTypeIds,
	setFilterTypeIds,
	dateFrom,
	setDateFrom,
	dateTo,
	setDateTo,
	sortBy,
	setSortBy,
	expenseTypes,
	hasActiveFilters,
	onClearFilters,
}: ExpenseFiltersProps) {
	const { t } = useTranslation();
	const [datePreset, setDatePreset] = useState<DatePreset | null>(null);

	// Convert string dates to DateRange
	const dateRange: DateRange | undefined =
		dateFrom || dateTo
			? {
					from: dateFrom ? new Date(dateFrom) : undefined,
					to: dateTo ? new Date(dateTo) : undefined,
				}
			: undefined;

	const handleDateRangeChange = (range: DateRange | undefined) => {
		setDateFrom(range?.from ? range.from.toISOString().split("T")[0] : "");
		setDateTo(range?.to ? range.to.toISOString().split("T")[0] : "");
	};

	const handleDatePresetChange = (preset: DatePreset | null) => {
		setDatePreset(preset);
	};

	const handleClearFilters = () => {
		setDatePreset(null);
		onClearFilters();
	};

	const expenseSortLabelByValue: Record<SortOption, string> = {
		dateDesc: t("expenses.sortDateDesc"),
		dateAsc: t("expenses.sortDateAsc"),
		amountDesc: t("expenses.sortAmountDesc"),
		amountAsc: t("expenses.sortAmountAsc"),
		typeAsc: t("expenses.sortTypeAsc"),
		typeDesc: t("expenses.sortTypeDesc"),
	};

	const expenseTypeOptions = expenseTypes.map((type) => ({
		value: type.id,
		label: type.name,
		color: getEntityColor(type.id),
		labelClassName: "capitalize",
	}));

	const moreFilters = (
		<>
			<div className="col-span-1">
				<Label className="text-sm font-light">{t("expenses.typeFilter")}</Label>
				<MultiSelectDropdown
					value={filterTypeIds}
					onValueChange={setFilterTypeIds}
					options={expenseTypeOptions}
					placeholder={t("expenses.allTypes")}
				/>
			</div>
			<div className="col-span-1">
				<Label className="text-sm font-light">{t("listFilters.sortBy")}</Label>
				<Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
					<SelectTrigger className="mt-1.5 w-full">
						<SelectValue>{expenseSortLabelByValue[sortBy]}</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="dateDesc">{t("expenses.sortDateDesc")}</SelectItem>
						<SelectItem value="dateAsc">{t("expenses.sortDateAsc")}</SelectItem>
						<SelectItem value="amountDesc">{t("expenses.sortAmountDesc")}</SelectItem>
						<SelectItem value="amountAsc">{t("expenses.sortAmountAsc")}</SelectItem>
						<SelectItem value="typeAsc">{t("expenses.sortTypeAsc")}</SelectItem>
						<SelectItem value="typeDesc">{t("expenses.sortTypeDesc")}</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</>
	);

	return (
		<ListFilters
			searchValue={query}
			onSearchChange={setQuery}
			searchPlaceholder={t("expenses.searchPlaceholder")}
			datePreset={datePreset}
			onDatePresetChange={handleDatePresetChange}
			dateRange={dateRange}
			onDateRangeChange={handleDateRangeChange}
			hasActiveFilters={hasActiveFilters}
			onClearFilters={handleClearFilters}
			moreFilters={moreFilters}
		/>
	);
}
