import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@offline-sqlite/i18n";

type SortOption = "createdDesc" | "createdAsc" | "nameAsc" | "nameDesc";

interface TypeFiltersProps {
	type: "visit" | "expense";
	query: string;
	sortBy: SortOption;
	onQueryChange: (query: string) => void;
	onSortChange: (sort: SortOption) => void;
}

export function TypeFilters({ type, query, sortBy, onQueryChange, onSortChange }: TypeFiltersProps) {
	const { t } = useTranslation();

	const sortLabelByValue: Record<SortOption, string> = {
		createdDesc: t(`${type}Types.sortNewest`),
		createdAsc: t(`${type}Types.sortOldest`),
		nameAsc: t(`${type}Types.sortNameAsc`),
		nameDesc: t(`${type}Types.sortNameDesc`),
	};

	const hasActiveFilters = query.trim().length > 0 || sortBy !== "createdDesc";

	const clearFilters = () => {
		onQueryChange("");
		onSortChange("createdDesc");
	};

	return (
		<div className="mb-6 grid gap-4 sm:grid-cols-2">
			<div>
				<Label className="text-sm font-light">{t(`${type}Types.searchLabel`)}</Label>
				<Input
					value={query}
					onChange={(event) => onQueryChange(event.target.value)}
					placeholder={t(`${type}Types.searchPlaceholder`)}
					className="mt-1.5"
				/>
			</div>
			<div>
				<Label className="text-sm font-light">{t("listFilters.sortBy")}</Label>
				<Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
					<SelectTrigger className="mt-1.5 w-full">
						<SelectValue>{sortLabelByValue[sortBy]}</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="createdDesc">{t(`${type}Types.sortNewest`)}</SelectItem>
						<SelectItem value="createdAsc">{t(`${type}Types.sortOldest`)}</SelectItem>
						<SelectItem value="nameAsc">{t(`${type}Types.sortNameAsc`)}</SelectItem>
						<SelectItem value="nameDesc">{t(`${type}Types.sortNameDesc`)}</SelectItem>
					</SelectContent>
				</Select>
			</div>
			{hasActiveFilters && (
				<div className="sm:col-span-2">
					<Button variant="ghost" size="sm" onClick={clearFilters}>
						{t("listFilters.clearFilters")}
					</Button>
				</div>
			)}
		</div>
	);
}

export { type SortOption };
