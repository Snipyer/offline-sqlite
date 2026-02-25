import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CreditCard, Calendar, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Loader from "@/components/loader";
import { pageContainerVariants, pageItemVariants, sectionFadeVariants } from "@/lib/animations";
import { trpc } from "@/utils/trpc";
import { Currency, formatDate, useTranslation } from "@offline-sqlite/i18n";
import { PaginationControls } from "@/components/pagination-controls";
import { ListFilters } from "@/features/list-filters/components/list-filters";
import {
	fromTimestampsToDateRange,
	toTimestampRange,
	type DatePreset,
} from "@/features/list-filters/utils/date-filters";

interface PaymentFilters {
	query: string;
	dateFrom?: number;
	dateTo?: number;
	minAmount: string;
	maxAmount: string;
	sortBy: "dateDesc" | "dateAsc" | "amountDesc" | "amountAsc" | "patientNameAsc" | "patientNameDesc";
}

const emptyFilters: PaymentFilters = {
	query: "",
	dateFrom: undefined,
	dateTo: undefined,
	minAmount: "",
	maxAmount: "",
	sortBy: "dateDesc",
};

export default function PaymentsList() {
	const { t } = useTranslation();
	const [filters, setFilters] = useState<PaymentFilters>(emptyFilters);
	const [datePreset, setDatePreset] = useState<DatePreset | null>(null);
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const payments = useQuery({
		...trpc.payment.list.queryOptions({
			query: filters.query || undefined,
			dateFrom: filters.dateFrom,
			dateTo: filters.dateTo,
			minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
			maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
			sortBy: filters.sortBy,
			page,
			pageSize,
		}),
		enabled: true,
	});

	useEffect(() => {
		setPage(1);
	}, [
		filters.query,
		filters.dateFrom,
		filters.dateTo,
		filters.minAmount,
		filters.maxAmount,
		filters.sortBy,
	]);

	useEffect(() => {
		if (payments.data && page > payments.data.totalPages) {
			setPage(payments.data.totalPages);
		}
	}, [payments.data, page]);

	const clearFilters = () => {
		setFilters(emptyFilters);
		setDatePreset(null);
	};

	const hasActiveFilters =
		filters.query ||
		filters.dateFrom ||
		filters.dateTo ||
		filters.minAmount ||
		filters.maxAmount ||
		filters.sortBy !== "dateDesc";
	const dateRange = fromTimestampsToDateRange(filters.dateFrom, filters.dateTo);
	const listRenderKey = `${filters.query}:${filters.minAmount}:${filters.maxAmount}:${filters.sortBy}:${payments.data?.page ?? page}`;

	const paymentSortLabelByValue: Record<PaymentFilters["sortBy"], string> = {
		dateDesc: t("payments.sortDateNewest"),
		dateAsc: t("payments.sortDateOldest"),
		amountDesc: t("payments.sortAmountHigh"),
		amountAsc: t("payments.sortAmountLow"),
		patientNameAsc: t("payments.sortPatientNameAsc"),
		patientNameDesc: t("payments.sortPatientNameDesc"),
	};

	return (
		<motion.div
			id="payments-list-top"
			variants={pageContainerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-5xl px-4 py-8"
		>
			{/* Header */}
			<motion.div variants={pageItemVariants} className="mb-8">
				<div className="flex items-center gap-4">
					<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
						<DollarSign className="text-primary h-6 w-6" />
					</div>
					<div>
						<h1 className="text-3xl font-semibold tracking-tight">{t("payments.title")}</h1>
						<p className="text-muted-foreground mt-1">{t("payments.description")}</p>
					</div>
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
											{t("payments.minAmount")}
										</Label>
										<Input
											type="number"
											inputMode="numeric"
											min={0}
											value={filters.minAmount}
											onChange={(event) =>
												setFilters((prev) => ({
													...prev,
													minAmount: event.target.value,
												}))
											}
											className="mt-1.5"
										/>
									</div>
									<div>
										<Label className="text-sm font-light">
											{t("payments.maxAmount")}
										</Label>
										<Input
											type="number"
											inputMode="numeric"
											min={0}
											value={filters.maxAmount}
											onChange={(event) =>
												setFilters((prev) => ({
													...prev,
													maxAmount: event.target.value,
												}))
											}
											className="mt-1.5"
										/>
									</div>
									<div>
										<Label className="text-sm font-light">
											{t("listFilters.sortBy")}
										</Label>
										<Select
											value={filters.sortBy}
											onValueChange={(value) =>
												setFilters((prev) => ({
													...prev,
													sortBy: value as PaymentFilters["sortBy"],
												}))
											}
										>
											<SelectTrigger className="mt-1.5 w-full">
												<SelectValue>
													{paymentSortLabelByValue[filters.sortBy]}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="dateDesc">
													{t("payments.sortDateNewest")}
												</SelectItem>
												<SelectItem value="dateAsc">
													{t("payments.sortDateOldest")}
												</SelectItem>
												<SelectItem value="amountDesc">
													{t("payments.sortAmountHigh")}
												</SelectItem>
												<SelectItem value="amountAsc">
													{t("payments.sortAmountLow")}
												</SelectItem>
												<SelectItem value="patientNameAsc">
													{t("payments.sortPatientNameAsc")}
												</SelectItem>
												<SelectItem value="patientNameDesc">
													{t("payments.sortPatientNameDesc")}
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</>
							}
						/>

						{payments.isLoading ? (
							<Loader className="h-64 pt-0" />
						) : (payments.data?.items.length ?? 0) === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 text-center">
								<div
									className="bg-muted/50 mb-4 flex h-20 w-20 items-center justify-center
										rounded-3xl"
								>
									<CreditCard className="text-muted-foreground/50 h-10 w-10" />
								</div>
								<h3 className="mb-1 text-base font-semibold">
									{t("payments.noPaymentsFound")}
								</h3>
								<p className="text-muted-foreground max-w-xs text-sm">
									{hasActiveFilters
										? t("payments.tryClearingFilters")
										: t("payments.noPaymentsDescription")}
								</p>
							</div>
						) : (
							<div className="space-y-6">
								<div key={listRenderKey} className="space-y-4">
									{payments.data?.items.map((payment) => (
										<div
											key={payment.id}
											className="group border-border/50 hover:border-border bg-muted/30
												hover:bg-card relative overflow-hidden rounded-2xl border p-5
												transition-[background-color,border-color,box-shadow]
												duration-300"
										>
											{/* Hover gradient */}
											<div
												className="from-primary/5 pointer-events-none absolute inset-0
													bg-linear-to-br via-transparent to-transparent opacity-0
													transition-opacity group-hover:opacity-100"
											/>

											<div className="relative">
												<div className="flex items-start gap-4">
													{/* Avatar */}
													<div
														className="flex h-14 w-14 shrink-0 items-center
															justify-center rounded-2xl bg-emerald-500/10"
													>
														<CreditCard className="h-6 w-6 text-emerald-500" />
													</div>

													{/* Main Content */}
													<div className="min-w-0 flex-1">
														<h3 className="truncate text-lg font-semibold">
															{payment.patientName}
														</h3>
														<p
															className="text-muted-foreground mb-2 flex
																items-center gap-2 text-sm"
														>
															<Calendar className="h-3.5 w-3.5" />
															{(() => {
																const recordedAtTime = new Date(
																	payment.recordedAt,
																).getTime();
																return Number.isNaN(recordedAtTime)
																	? "-"
																	: formatDate(recordedAtTime);
															})()}
														</p>
														{payment.notes && (
															<p
																className="text-muted-foreground line-clamp-2
																	text-sm"
															>
																{payment.notes}
															</p>
														)}
													</div>

													{/* Right Side - Payment Amount */}
													<div className="flex shrink-0 flex-col items-end gap-1">
														{/* Icon and label on same line */}
														<div className="mb-1 flex items-center gap-1.5">
															<div
																className="flex h-6 w-6 items-center
																	justify-center rounded-lg
																	bg-emerald-500/10"
															>
																<CreditCard
																	className="h-3.5 w-3.5 text-emerald-600"
																/>
															</div>
															<span
																className="text-xs font-medium
																	text-emerald-600/70"
															>
																{t("payments.cash")}
															</span>
														</div>
														{/* Amount underneath */}
														<span className="text-xl font-bold text-emerald-600">
															<Currency value={payment.amount} />
														</span>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
								<PaginationControls
									page={payments.data?.page ?? 1}
									totalPages={payments.data?.totalPages ?? 1}
									onPageChange={setPage}
									scrollTarget="payments-list-top"
								/>
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</motion.div>
	);
}
