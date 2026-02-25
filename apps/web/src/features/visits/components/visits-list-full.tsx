import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Loader2, Plus, Calendar, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import Loader from "@/components/loader";
import { PaginationControls } from "@/components/pagination-controls";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisitCard } from "@/features/visits/components/visit-card";
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

interface VisitFilters {
	dateFrom?: number;
	dateTo?: number;
	query: string;
	visitTypeIds: string[];
	hasUnpaid: boolean;
	sortBy: "dateDesc" | "dateAsc" | "patientNameAsc" | "patientNameDesc";
}

const emptyFilters: VisitFilters = {
	dateFrom: undefined,
	dateTo: undefined,
	query: "",
	visitTypeIds: [],
	hasUnpaid: false,
	sortBy: "dateDesc",
};

export default function VisitsList() {
	const { t } = useTranslation();
	const [filters, setFilters] = useState<VisitFilters>(emptyFilters);
	const [datePreset, setDatePreset] = useState<DatePreset | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const visitTypes = useQuery(trpc.visitType.list.queryOptions());

	const visits = useQuery({
		...trpc.visit.list.queryOptions({
			dateFrom: filters.dateFrom,
			dateTo: filters.dateTo,
			query: filters.query || undefined,
			visitTypeIds: filters.visitTypeIds.length > 0 ? filters.visitTypeIds : undefined,
			hasUnpaid: filters.hasUnpaid || undefined,
			sortBy: filters.sortBy,
			page,
			pageSize,
		}),
		enabled: true,
	});

	useEffect(() => {
		setPage(1);
	}, [
		filters.dateFrom,
		filters.dateTo,
		filters.query,
		filters.visitTypeIds,
		filters.hasUnpaid,
		filters.sortBy,
	]);

	const softDeleteMutation = useMutation(
		trpc.visit.softDelete.mutationOptions({
			onSuccess: () => visits.refetch(),
		}),
	);

	const restoreMutation = useMutation(
		trpc.visit.restore.mutationOptions({
			onSuccess: () => visits.refetch(),
		}),
	);

	const handleSoftDelete = (id: string) => {
		setDeleteId(id);
	};

	const confirmSoftDelete = () => {
		if (deleteId) {
			softDeleteMutation.mutate({ id: deleteId });
			setDeleteId(null);
		}
	};

	const handleRestore = (id: string) => {
		if (confirm(t("visits.confirmRestore"))) {
			restoreMutation.mutate({ id });
		}
	};

	const clearFilters = () => {
		setFilters(emptyFilters);
		setDatePreset(null);
	};

	const hasActiveFilters =
		filters.dateFrom ||
		filters.dateTo ||
		filters.query ||
		filters.visitTypeIds.length > 0 ||
		filters.hasUnpaid ||
		filters.sortBy !== "dateDesc";

	const dateRange = fromTimestampsToDateRange(filters.dateFrom, filters.dateTo);

	const visitSortLabelByValue: Record<VisitFilters["sortBy"], string> = {
		dateDesc: t("visits.sortDateNewest"),
		dateAsc: t("visits.sortDateOldest"),
		patientNameAsc: t("visits.sortPatientNameAsc"),
		patientNameDesc: t("visits.sortPatientNameDesc"),
	};

	const visitTypeOptions =
		visitTypes.data?.map((visitType) => ({
			value: visitType.id,
			label: visitType.name,
		})) ?? [];

	return (
		<motion.div
			id="visits-list-top"
			variants={pageContainerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-5xl px-4 py-8"
		>
			<motion.div variants={pageItemVariants} className="mb-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
							<Stethoscope className="text-primary h-6 w-6" />
						</div>
						<div>
							<h1 className="text-3xl font-semibold tracking-tight">{t("visits.title")}</h1>
							<p className="text-muted-foreground mt-1">{t("visits.description")}</p>
						</div>
					</div>
					<Link to="/visits/new">
						<Button className="gap-2">
							<Plus className="h-4 w-4" />
							{t("visits.addNew")}
						</Button>
					</Link>
				</div>
			</motion.div>

			<motion.div variants={sectionFadeVariants}>
				<Card className="border-border/50 overflow-hidden">
					<CardContent>
						<ListFilters
							searchValue={filters.query}
							onSearchChange={(value) => setFilters((prev) => ({ ...prev, query: value }))}
							searchPlaceholder={t("listFilters.searchNameLocationPhoneNote")}
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
							hasActiveFilters={Boolean(hasActiveFilters)}
							onClearFilters={clearFilters}
							moreFilters={
								<>
									<div>
										<Label className="text-sm font-light">
											{t("visits.procedureTypeFilter")}
										</Label>
										<MultiSelectDropdown
											value={filters.visitTypeIds}
											onValueChange={(visitTypeIds) =>
												setFilters((prev) => ({ ...prev, visitTypeIds }))
											}
											options={visitTypeOptions}
											placeholder={t("visits.allTypes")}
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
													"dateDesc") as VisitFilters["sortBy"];
												setFilters((prev) => ({
													...prev,
													sortBy: nextValue,
												}));
											}}
										>
											<SelectTrigger className="mt-1.5 w-full">
												<SelectValue>
													{visitSortLabelByValue[filters.sortBy]}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="dateDesc">
													{t("visits.sortDateNewest")}
												</SelectItem>
												<SelectItem value="dateAsc">
													{t("visits.sortDateOldest")}
												</SelectItem>
												<SelectItem value="patientNameAsc">
													{t("visits.sortPatientNameAsc")}
												</SelectItem>
												<SelectItem value="patientNameDesc">
													{t("visits.sortPatientNameDesc")}
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
											{t("visits.hasUnpaid")}
										</Button>
									</div>
								</>
							}
						/>

						{visits.isLoading ? (
							<Loader className="h-64 pt-0" />
						) : (visits.data?.items.length ?? 0) === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 text-center">
								<div
									className="bg-muted/50 mb-4 flex h-20 w-20 items-center justify-center
										rounded-3xl"
								>
									<Calendar className="text-muted-foreground/50 h-10 w-10" />
								</div>
								<h3 className="mb-1 text-base font-semibold">{t("visits.noVisitsFound")}</h3>
								<p className="text-muted-foreground mb-4 max-w-xs text-sm">
									{hasActiveFilters
										? t("visits.tryClearingFilters")
										: t("visits.noVisitsDescription")}
								</p>
								<Link to="/visits/new">
									<Button className="gap-2">
										<Plus className="h-4 w-4" />
										{t("visits.createFirstVisit")}
									</Button>
								</Link>
							</div>
						) : (
							<div className="space-y-6">
								<div className="space-y-4">
									{visits.data?.items.map((visit, index) => (
										<VisitCard
											key={visit.id}
											visit={visit}
											index={index}
											showPatient
											editLink={`/visits/${visit.id}/edit`}
											onDelete={() => handleSoftDelete(visit.id)}
											onRestore={() => handleRestore(visit.id)}
										/>
									))}
								</div>
								<PaginationControls
									page={visits.data?.page ?? 1}
									totalPages={visits.data?.totalPages ?? 1}
									onPageChange={setPage}
									scrollTarget="visits-list-top"
								/>
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			<AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
				<AlertDialogContent onOverlayClick={() => setDeleteId(null)}>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("visits.confirmDeleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("visits.confirmDelete")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction variant="destructive" onClick={confirmSoftDelete}>
							{softDeleteMutation.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</motion.div>
	);
}
