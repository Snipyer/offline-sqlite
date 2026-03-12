import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { User, Users } from "lucide-react";
import { useEffect, useState } from "react";

import Loader from "@/components/loader";
import { PaginationControls } from "@/components/pagination-controls";
import { PatientCard } from "@/components/patient-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDirection } from "@/components/ui/direction";
import { ListFilters } from "@/features/list-filters/components/list-filters";
import { MultiSelectDropdown } from "@/features/list-filters/components/multi-select-dropdown";
import {
	fromTimestampsToDateRange,
	toTimestampRange,
	type DatePreset,
} from "@/features/list-filters/utils/date-filters";
import { pageContainerVariants, pageItemVariants, sectionFadeVariants } from "@/lib/animations";
import { useTranslation } from "@offline-sqlite/i18n";
import { trpc } from "@/utils/trpc";
import { getEntityColor } from "@/utils/entity-colors";
import PatientEditForm from "./patient-edit-form";

import { PatientSheet } from "./patient-sheet";

interface PatientFilters {
	sex: string;
	dateFrom?: number;
	dateTo?: number;
	visitTypeIds: string[];
	hasUnpaid: boolean;
	hasUpcomingAppointment: boolean;
	query: string;
	sortBy: "lastVisitDesc" | "nameAsc" | "nameDesc" | "unpaidDesc";
}

const emptyFilters: PatientFilters = {
	sex: "",
	dateFrom: undefined,
	dateTo: undefined,
	visitTypeIds: [],
	hasUnpaid: false,
	hasUpcomingAppointment: false,
	query: "",
	sortBy: "lastVisitDesc",
};

export function PatientsList() {
	const { t } = useTranslation();
	const direction = useDirection();
	const [filters, setFilters] = useState<PatientFilters>(emptyFilters);
	const [datePreset, setDatePreset] = useState<DatePreset | null>(null);
	const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
	const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const visitTypes = useQuery(trpc.visitType.list.queryOptions());

	const patients = useQuery({
		...trpc.patient.listWithFilters.queryOptions({
			sex: filters.sex ? (filters.sex as "M" | "F") : undefined,
			dateFrom: filters.dateFrom,
			dateTo: filters.dateTo,
			visitTypeIds: filters.visitTypeIds.length > 0 ? filters.visitTypeIds : undefined,
			hasUnpaid: filters.hasUnpaid || undefined,
			hasUpcomingAppointment: filters.hasUpcomingAppointment || undefined,
			query: filters.query || undefined,
			sortBy: filters.sortBy,
			page,
			pageSize,
		}),
		enabled: true,
	});

	useEffect(() => {
		setPage(1);
	}, [
		filters.sex,
		filters.dateFrom,
		filters.dateTo,
		filters.visitTypeIds,
		filters.hasUnpaid,
		filters.hasUpcomingAppointment,
		filters.query,
		filters.sortBy,
	]);

	const clearFilters = () => {
		setFilters(emptyFilters);
		setDatePreset(null);
	};

	const hasActiveFilters = Boolean(
		filters.sex ||
		filters.dateFrom ||
		filters.dateTo ||
		filters.visitTypeIds.length > 0 ||
		filters.hasUnpaid ||
		filters.hasUpcomingAppointment ||
		filters.query ||
		filters.sortBy !== "lastVisitDesc",
	);

	const dateRange = fromTimestampsToDateRange(filters.dateFrom, filters.dateTo);

	const patientSortLabelByValue: Record<PatientFilters["sortBy"], string> = {
		lastVisitDesc: t("patients.sortLastVisitNewest"),
		nameAsc: t("patients.sortNameAsc"),
		nameDesc: t("patients.sortNameDesc"),
		unpaidDesc: t("patients.sortUnpaidHighest"),
	};

	const visitTypeOptions =
		visitTypes.data?.map((visitType) => ({
			value: visitType.id,
			label: visitType.name,
			color: getEntityColor(visitType.id),
		})) ?? [];

	return (
		<motion.div
			id="patients-list-top"
			variants={pageContainerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-5xl px-4 py-8"
		>
			<motion.div variants={pageItemVariants} className="mb-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
							<Users className="text-primary h-6 w-6" />
						</div>
						<div>
							<h1 className="text-3xl font-semibold tracking-tight">{t("patients.title")}</h1>
							<p className="text-muted-foreground mt-1">{t("patients.description")}</p>
						</div>
					</div>
				</div>
			</motion.div>

			<motion.div variants={sectionFadeVariants}>
				<Card className="border-border/50 overflow-hidden">
					<CardContent>
						<ListFilters
							searchValue={filters.query}
							onSearchChange={(value) => setFilters((prev) => ({ ...prev, query: value }))}
							searchPlaceholder={t("listFilters.searchNameLocationPhone")}
							datePreset={datePreset}
							onDatePresetChange={setDatePreset}
							dateRange={dateRange}
							onDateRangeChange={(range) => {
								const nextRange = toTimestampRange(range);
								setFilters((prev) => ({
									...prev,
									dateFrom: nextRange.dateFrom,
									dateTo: nextRange.dateTo,
								}));
							}}
							hasActiveFilters={hasActiveFilters}
							onClearFilters={clearFilters}
							moreFilters={
								<>
									<div>
										<Label className="text-sm font-light">{t("patients.sex")}</Label>
										<Select
											value={filters.sex || "all"}
											onValueChange={(value) => {
												const nextValue = value ?? "all";
												setFilters((prev) => ({
													...prev,
													sex: nextValue === "all" ? "" : nextValue,
												}));
											}}
										>
											<SelectTrigger className="mt-1.5 w-full">
												<SelectValue>
													{filters.sex === "M"
														? t("patients.male")
														: filters.sex === "F"
															? t("patients.female")
															: t("patients.allSexes")}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">{t("patients.allSexes")}</SelectItem>
												<SelectItem value="M">{t("patients.male")}</SelectItem>
												<SelectItem value="F">{t("patients.female")}</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div>
										<Label className="text-sm font-light">
											{t("patients.visitType")}
										</Label>
										<MultiSelectDropdown
											value={filters.visitTypeIds}
											onValueChange={(visitTypeIds) =>
												setFilters((prev) => ({ ...prev, visitTypeIds }))
											}
											options={visitTypeOptions}
											placeholder={t("patients.allTypes")}
										/>
									</div>

									<div>
										<Label className="text-sm font-light">
											{t("listFilters.sortBy")}
										</Label>
										<Select
											value={filters.sortBy}
											onValueChange={(value) => {
												const nextValue = (value ??
													"lastVisitDesc") as PatientFilters["sortBy"];
												setFilters((prev) => ({
													...prev,
													sortBy: nextValue,
												}));
											}}
										>
											<SelectTrigger className="mt-1.5 w-full">
												<SelectValue>
													{patientSortLabelByValue[filters.sortBy]}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="lastVisitDesc">
													{t("patients.sortLastVisitNewest")}
												</SelectItem>
												<SelectItem value="nameAsc">
													{t("patients.sortNameAsc")}
												</SelectItem>
												<SelectItem value="nameDesc">
													{t("patients.sortNameDesc")}
												</SelectItem>
												<SelectItem value="unpaidDesc">
													{t("patients.sortUnpaidHighest")}
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="mt-3 flex items-end sm:col-span-2 lg:col-span-1">
										<Button
											type="button"
											variant={filters.hasUnpaid ? "default" : "outline"}
											size="default"
											onClick={() =>
												setFilters((prev) => ({
													...prev,
													hasUnpaid: !prev.hasUnpaid,
												}))
											}
										>
											{t("patients.hasUnpaid")}
										</Button>
									</div>

									<div className="mt-3 flex items-end sm:col-span-2 lg:col-span-1">
										<Button
											type="button"
											variant={filters.hasUpcomingAppointment ? "default" : "outline"}
											size="default"
											onClick={() =>
												setFilters((prev) => ({
													...prev,
													hasUpcomingAppointment: !prev.hasUpcomingAppointment,
												}))
											}
										>
											{t("patients.hasUpcomingAppointment")}
										</Button>
									</div>
								</>
							}
						/>

						{patients.isLoading ? (
							<Loader className="h-64 pt-0" />
						) : (patients.data?.items.length ?? 0) === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 text-center">
								<div
									className="bg-muted/50 mb-4 flex h-20 w-20 items-center justify-center
										rounded-3xl"
								>
									<User className="text-muted-foreground/50 h-10 w-10" />
								</div>
								<h3 className="mb-1 text-base font-semibold">
									{t("patients.noPatientsFound")}
								</h3>
								<p className="text-muted-foreground max-w-xs text-sm">
									{hasActiveFilters
										? t("patients.tryClearingFilters")
										: t("patients.noPatientsDescription")}
								</p>
							</div>
						) : (
							<div className="space-y-6">
								<div className="space-y-3">
									{patients.data?.items.map((data, index) => (
										<PatientCard
											key={data.patient.id}
											patient={data.patient}
											lastVisit={data.lastVisit}
											visits={data.visits}
											totalUnpaid={data.totalUnpaid}
											upcomingAppointment={data.upcomingAppointment}
											onClick={() => setSelectedPatientId(data.patient.id)}
											index={index}
										/>
									))}
								</div>
								<PaginationControls
									page={patients.data?.page ?? 1}
									totalPages={patients.data?.totalPages ?? 1}
									onPageChange={setPage}
									scrollTarget="patients-list-top"
								/>
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			<PatientSheet
				patientId={selectedPatientId}
				onClose={() => {
					setSelectedPatientId(null);
					setEditingPatientId(null);
				}}
				onEdit={(patientId) => setEditingPatientId(patientId)}
			/>

			<Sheet open={!!editingPatientId} onOpenChange={(open) => !open && setEditingPatientId(null)}>
				<SheetContent
					side={direction === "rtl" ? "left" : "right"}
					dir={direction}
					className="inset-y-0! z-60 flex h-full! w-[95vw] max-w-150! flex-col border-l pt-6"
				>
					{editingPatientId && (
						<PatientEditForm
							patientId={editingPatientId}
							inSheet
							onCancel={() => setEditingPatientId(null)}
							onSuccess={() => setEditingPatientId(null)}
						/>
					)}
				</SheetContent>
			</Sheet>
		</motion.div>
	);
}

export default function PatientsPage() {
	return <PatientsList />;
}
