import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Loader2, Filter, X, Plus, Calendar, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import Loader from "@/components/loader";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VisitCard } from "@/components/visit-card";
import { pageContainerVariants, pageItemVariants, sectionFadeVariants } from "@/lib/animations";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { PaginationControls } from "@/components/pagination-controls";

interface VisitFilters {
	dateFrom: string;
	dateTo: string;
	patientName: string;
	visitTypeId: string;
}

const emptyFilters: VisitFilters = {
	dateFrom: "",
	dateTo: "",
	patientName: "",
	visitTypeId: "",
};

export default function VisitsList() {
	const { t } = useTranslation();
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<VisitFilters>(emptyFilters);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const visitTypes = useQuery(trpc.visitType.list.queryOptions());

	const visits = useQuery({
		...trpc.visit.list.queryOptions({
			dateFrom: filters.dateFrom ? new Date(filters.dateFrom).getTime() : undefined,
			dateTo: filters.dateTo ? new Date(filters.dateTo).getTime() : undefined,
			patientName: filters.patientName || undefined,
			visitTypeId: filters.visitTypeId || undefined,
			page,
			pageSize,
		}),
		enabled: true,
	});

	useEffect(() => {
		setPage(1);
	}, [filters.dateFrom, filters.dateTo, filters.patientName, filters.visitTypeId]);

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
	};

	const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.patientName || filters.visitTypeId;

	return (
		<motion.div
			id="visits-list-top"
			variants={pageContainerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-5xl px-4 py-8"
		>
			{/* Header */}
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
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl
										bg-blue-500/10"
								>
									<Calendar className="h-5 w-5 text-blue-500" />
								</div>
								<CardTitle className="text-base font-semibold">
									{t("visits.allVisits")}
								</CardTitle>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowFilters(!showFilters)}
								className="gap-2"
							>
								<Filter className="h-4 w-4" />
								{t("visits.filters")}
								{hasActiveFilters && (
									<span
										className="bg-primary text-primary-foreground ml-2 rounded-full px-2
											py-0.5 text-xs"
									>
										!
									</span>
								)}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{showFilters && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="border-border/50 bg-muted/30 mb-6 rounded-xl border p-4"
							>
								<div className="mb-4 flex items-center justify-between">
									<h3 className="font-medium">{t("visits.filterVisits")}</h3>
									{hasActiveFilters && (
										<Button
											variant="ghost"
											size="sm"
											onClick={clearFilters}
											className="gap-1"
										>
											<X className="h-3 w-3" />
											{t("visits.clearFilters")}
										</Button>
									)}
								</div>
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
									<div>
										<Label
											className="text-muted-foreground text-xs font-medium
												tracking-wider uppercase"
										>
											{t("visits.fromDate")}
										</Label>
										<Input
											type="date"
											value={filters.dateFrom}
											onChange={(e) =>
												setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
											}
											className="mt-1.5"
										/>
									</div>
									<div>
										<Label
											className="text-muted-foreground text-xs font-medium
												tracking-wider uppercase"
										>
											{t("visits.toDate")}
										</Label>
										<Input
											type="date"
											value={filters.dateTo}
											onChange={(e) =>
												setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
											}
											className="mt-1.5"
										/>
									</div>
									<div>
										<Label
											className="text-muted-foreground text-xs font-medium
												tracking-wider uppercase"
										>
											{t("visits.filterPatient")}
										</Label>
										<Input
											value={filters.patientName}
											onChange={(e) =>
												setFilters((prev) => ({
													...prev,
													patientName: e.target.value,
												}))
											}
											placeholder={t("visits.searchPatients")}
											className="mt-1.5"
										/>
									</div>
									<div>
										<Label
											className="text-muted-foreground text-xs font-medium
												tracking-wider uppercase"
										>
											{t("visits.procedureTypeFilter")}
										</Label>
										<select
											value={filters.visitTypeId}
											onChange={(e) =>
												setFilters((prev) => ({
													...prev,
													visitTypeId: e.target.value,
												}))
											}
											className="border-input bg-background mt-1.5 h-10 w-full
												rounded-md border px-3"
										>
											<option value="">{t("visits.allTypes")}</option>
											{visitTypes.data?.map((vt) => (
												<option key={vt.id} value={vt.id}>
													{vt.name}
												</option>
											))}
										</select>
									</div>
								</div>
							</motion.div>
						)}

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
