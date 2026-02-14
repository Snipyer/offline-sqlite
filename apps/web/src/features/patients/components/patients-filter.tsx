import { X, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@offline-sqlite/i18n";

export interface PatientFilters {
	sex: string;
	dateFrom: string;
	dateTo: string;
	visitTypeId: string;
	hasUnpaid: boolean;
	name: string;
}

interface PatientsFilterProps {
	filters: PatientFilters;
	onFilterChange: (filters: PatientFilters) => void;
	visitTypes: { id: string; name: string }[];
	hasActiveFilters: boolean;
	onClearFilters: () => void;
	showFilters: boolean;
	onToggleFilters: () => void;
}

export function PatientsFilter({
	filters,
	onFilterChange,
	visitTypes,
	hasActiveFilters,
	onClearFilters,
	showFilters,
	onToggleFilters,
}: PatientsFilterProps) {
	const { t } = useTranslation();

	return (
		<>
			<div className="flex items-center justify-between">
				<h3 className="font-medium">{t("patients.filterPatients")}</h3>
				{hasActiveFilters && (
					<Button variant="ghost" size="sm" onClick={onClearFilters}>
						<X className="mr-1 h-3 w-3" />
						{t("patients.clearFilters")}
					</Button>
				)}
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div>
					<Label className="text-sm">{t("patients.searchName")}</Label>
					<Input
						value={filters.name}
						onChange={(e) => onFilterChange({ ...filters, name: e.target.value })}
						placeholder={t("patients.searchNamePlaceholder")}
						className="mt-1.5"
					/>
				</div>
				<div>
					<Label className="text-sm">{t("patients.sex")}</Label>
					<select
						value={filters.sex}
						onChange={(e) => onFilterChange({ ...filters, sex: e.target.value })}
						className="border-input bg-background mt-1.5 h-10 w-full rounded-md border px-3"
					>
						<option value="">{t("patients.allSexes")}</option>
						<option value="M">{t("patients.male")}</option>
						<option value="F">{t("patients.female")}</option>
					</select>
				</div>
				<div>
					<Label className="text-sm">{t("patients.fromDate")}</Label>
					<Input
						type="date"
						value={filters.dateFrom}
						onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
						className="mt-1.5"
					/>
				</div>
				<div>
					<Label className="text-sm">{t("patients.toDate")}</Label>
					<Input
						type="date"
						value={filters.dateTo}
						onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
						className="mt-1.5"
					/>
				</div>
				<div>
					<Label className="text-sm">{t("patients.visitType")}</Label>
					<select
						value={filters.visitTypeId}
						onChange={(e) => onFilterChange({ ...filters, visitTypeId: e.target.value })}
						className="border-input bg-background mt-1.5 h-10 w-full rounded-md border px-3"
					>
						<option value="">{t("patients.allTypes")}</option>
						{visitTypes.map((vt) => (
							<option key={vt.id} value={vt.id}>
								{vt.name}
							</option>
						))}
					</select>
				</div>
				<div className="flex items-end">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={filters.hasUnpaid}
							onChange={(e) => onFilterChange({ ...filters, hasUnpaid: e.target.checked })}
							className="h-4 w-4"
						/>
						<span className="text-sm">{t("patients.hasUnpaid")}</span>
					</label>
				</div>
			</div>
		</>
	);
}

export function FilterToggle({
	showFilters,
	onToggle,
	hasActiveFilters,
}: {
	showFilters: boolean;
	onToggle: () => void;
	hasActiveFilters: boolean;
}) {
	const { t } = useTranslation();

	return (
		<Button variant="outline" onClick={onToggle}>
			<Filter className="mr-2 h-4 w-4" />
			{t("patients.filters")}
			{hasActiveFilters && (
				<span className="bg-primary text-primary-foreground ml-2 rounded-full px-2 py-0.5 text-xs">
					!
				</span>
			)}
		</Button>
	);
}
