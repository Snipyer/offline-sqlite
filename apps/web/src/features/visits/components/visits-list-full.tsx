import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Loader2,
	Trash2,
	RotateCcw,
	Filter,
	X,
	Pencil,
	Plus,
	Calendar,
	User,
	CreditCard,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

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
import { ToothBadge } from "@/features/tooth-selector/components/tooth-selector";
import { trpc } from "@/utils/trpc";
import { Currency, formatDate, useTranslation } from "@offline-sqlite/i18n";

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

	const visitTypes = useQuery(trpc.visitType.list.queryOptions());

	const visits = useQuery({
		...trpc.visit.list.queryOptions({
			dateFrom: filters.dateFrom ? new Date(filters.dateFrom).getTime() : undefined,
			dateTo: filters.dateTo ? new Date(filters.dateTo).getTime() : undefined,
			patientName: filters.patientName || undefined,
			visitTypeId: filters.visitTypeId || undefined,
		}),
		enabled: true,
	});

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
		<div className="mx-auto w-full max-w-4xl py-8">
			{/* Header */}
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{t("visits.title")}</h1>
					<p className="text-muted-foreground mt-1">{t("visits.description")}</p>
				</div>
				<div className="flex items-center gap-3">
					<Link to="/visits/new">
						<Button size="lg">
							<Plus className="mr-2 h-4 w-4" />
							{t("visits.addNew")}
						</Button>
					</Link>
				</div>
			</div>

			<Card>
				<CardHeader className="pb-4">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">{t("visits.allVisits")}</CardTitle>
						<Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
							<Filter className="mr-2 h-4 w-4" />
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
						<div className="bg-card mb-6 rounded-lg border p-4">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-medium">{t("visits.filterVisits")}</h3>
								{hasActiveFilters && (
									<Button variant="ghost" size="sm" onClick={clearFilters}>
										<X className="mr-1 h-3 w-3" />
										{t("visits.clearFilters")}
									</Button>
								)}
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<div>
									<Label className="text-sm">{t("visits.fromDate")}</Label>
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
									<Label className="text-sm">{t("visits.toDate")}</Label>
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
									<Label className="text-sm">{t("visits.filterPatient")}</Label>
									<Input
										value={filters.patientName}
										onChange={(e) =>
											setFilters((prev) => ({ ...prev, patientName: e.target.value }))
										}
										placeholder={t("visits.searchPatients")}
										className="mt-1.5"
									/>
								</div>
								<div>
									<Label className="text-sm">{t("visits.procedureTypeFilter")}</Label>
									<select
										value={filters.visitTypeId}
										onChange={(e) =>
											setFilters((prev) => ({ ...prev, visitTypeId: e.target.value }))
										}
										className="border-input bg-background mt-1.5 h-10 w-full rounded-md
											border px-3"
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
						</div>
					)}

					{visits.isLoading ? (
						<div className="flex justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : visits.data?.length === 0 ? (
						<div className="py-12 text-center">
							<div className="mb-4 flex justify-center">
								<div
									className="bg-muted flex h-16 w-16 items-center justify-center
										rounded-full"
								>
									<Calendar className="text-muted-foreground h-8 w-8" />
								</div>
							</div>
							<p className="text-muted-foreground mb-4">{t("visits.noVisitsFound")}</p>
							<Link to="/visits/new">
								<Button>
									<Plus className="mr-2 h-4 w-4" />
									{t("visits.createFirstVisit")}
								</Button>
							</Link>
						</div>
					) : (
						<div className="space-y-4">
							{visits.data?.map((visit) => (
								<div
									key={visit.id}
									className={`bg-card rounded-lg border p-5 transition-shadow
										hover:shadow-sm ${visit.isDeleted ? "opacity-60" : ""}`}
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1">
											{/* Header */}
											<div className="mb-3 flex items-center gap-3">
												<div
													className="bg-primary/10 flex h-10 w-10 items-center
														justify-center rounded-full"
												>
													<User className="text-primary h-5 w-5" />
												</div>
												<div>
													<div className="flex items-center gap-2">
														<h3 className="text-lg font-semibold">
															{visit.patient.name}
														</h3>
														{visit.isDeleted && (
															<span
																className="bg-destructive/10 text-destructive
																	rounded-full px-2 py-0.5 text-xs"
															>
																{t("visits.deletedMarker")}
															</span>
														)}
													</div>
													<p className="text-muted-foreground text-sm">
														{formatDate(visit.visitTime)}
													</p>
												</div>
											</div>

											{/* Treatment Acts */}
											{visit.acts.length > 0 && (
												<div className="mb-4 space-y-2">
													{visit.acts.map((act, idx) => (
														<div
															key={idx}
															className="bg-muted flex items-center gap-3
																rounded-md px-3 py-2"
														>
															<span
																className="text-muted-foreground text-sm
																	font-medium"
															>
																{idx + 1}.
															</span>
															<span className="text-sm font-medium">
																{act.visitType.name}
															</span>
															<ToothBadge teeth={act.teeth} />
															<span className="ml-auto font-semibold">
																<Currency value={act.price} size="sm" />
															</span>
														</div>
													))}
												</div>
											)}

											{/* Payment Summary */}
											<div
												className="bg-muted/50 flex items-center gap-6 rounded-md px-4
													py-3"
											>
												<div className="flex items-center gap-2">
													<CreditCard className="text-muted-foreground h-4 w-4" />
													<span className="text-muted-foreground text-sm">
														{t("visits.totalAmount")}:
													</span>
													<Currency value={visit.totalAmount} size="sm" />
												</div>
												<div className="bg-border h-4 w-px" />
												<div className="flex items-center gap-2">
													<span className="text-muted-foreground text-sm">
														{t("visits.amountPaid")}:
													</span>
													<Currency value={visit.amountPaid} size="sm" />
												</div>
												<div className="bg-border h-4 w-px" />
												<div className="flex items-center gap-2">
													<span className="text-muted-foreground text-sm">
														{t("visits.amountLeft")}:
													</span>
													<span
														className={`font-semibold ${
															visit.amountLeft > 0
																? "text-orange-600"
																: "text-green-600"
															}`}
													>
														<Currency value={visit.amountLeft} size="sm" />
													</span>
												</div>
											</div>

											{/* Notes */}
											{visit.notes && (
												<p className="text-muted-foreground mt-3 text-sm">
													{visit.notes}
												</p>
											)}
										</div>

										{/* Actions */}
										<div className="flex flex-col gap-1">
											{!visit.isDeleted && (
												<Link to={`/visits/${visit.id}/edit`}>
													<Button
														variant="ghost"
														size="icon"
														aria-label={t("visits.editVisitAction")}
													>
														<Pencil className="h-4 w-4" />
													</Button>
												</Link>
											)}
											{visit.isDeleted ? (
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleRestore(visit.id)}
													disabled={restoreMutation.isPending}
													aria-label={t("visits.restoreVisitAction")}
												>
													<RotateCcw className="h-4 w-4" />
												</Button>
											) : (
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleSoftDelete(visit.id)}
													disabled={softDeleteMutation.isPending}
													className="text-destructive hover:text-destructive"
													aria-label={t("visits.deleteVisitAction")}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

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
		</div>
	);
}
