import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Loader2, Filter, X, CreditCard, User, Calendar, DollarSign } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";
import { Currency, formatDate, useTranslation } from "@offline-sqlite/i18n";
import { cn } from "@/lib/utils";

interface PaymentFilters {
	patientName: string;
}

const emptyFilters: PaymentFilters = {
	patientName: "",
};

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			ease: "easeOut" as const,
		},
	},
};

export default function PaymentsList() {
	const { t } = useTranslation();
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<PaymentFilters>(emptyFilters);

	const payments = useQuery({
		...trpc.payment.list.queryOptions({
			patientName: filters.patientName || undefined,
		}),
		enabled: true,
	});

	const clearFilters = () => {
		setFilters(emptyFilters);
	};

	const hasActiveFilters = filters.patientName;

	return (
		<motion.div
			variants={containerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-5xl px-4 py-8"
		>
			{/* Header */}
			<motion.div variants={itemVariants} className="mb-8">
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

			<motion.div variants={itemVariants}>
				<Card className="border-border/50 overflow-hidden">
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl
										bg-emerald-500/10"
								>
									<CreditCard className="h-5 w-5 text-emerald-500" />
								</div>
								<CardTitle className="text-base font-semibold">
									{t("payments.allPayments")}
								</CardTitle>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowFilters(!showFilters)}
								className="gap-2"
							>
								<Filter className="h-4 w-4" />
								{t("payments.filters")}
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
									<h3 className="font-medium">{t("payments.filterPayments")}</h3>
									{hasActiveFilters && (
										<Button
											variant="ghost"
											size="sm"
											onClick={clearFilters}
											className="gap-1"
										>
											<X className="h-3 w-3" />
											{t("payments.clearFilters")}
										</Button>
									)}
								</div>
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<Label
											className="text-muted-foreground text-xs font-medium
												tracking-wider uppercase"
										>
											{t("payments.patient")}
										</Label>
										<Input
											value={filters.patientName}
											onChange={(e) =>
												setFilters((prev) => ({
													...prev,
													patientName: e.target.value,
												}))
											}
											placeholder={t("payments.searchPatient")}
											className="mt-1.5"
										/>
									</div>
								</div>
							</motion.div>
						)}

						{payments.isLoading ? (
							<div className="flex h-64 items-center justify-center">
								<div className="relative">
									<div className="bg-primary/5 absolute inset-0 rounded-full blur-3xl" />
									<Loader2 className="text-primary relative h-10 w-10 animate-spin" />
								</div>
							</div>
						) : payments.data?.length === 0 ? (
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
							<div className="space-y-4">
								{payments.data?.map((payment, index) => (
									<motion.div
										key={payment.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 + index * 0.05 }}
										className="group border-border/50 hover:border-border bg-muted/30
											hover:bg-card relative overflow-hidden rounded-2xl border p-5
											transition-all duration-300"
									>
										{/* Hover gradient */}
										<div
											className="from-primary/5 pointer-events-none absolute inset-0
												bg-gradient-to-br via-transparent to-transparent opacity-0
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
														{formatDate(new Date(payment.recordedAt).getTime())}
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
																justify-center rounded-lg bg-emerald-500/10"
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
									</motion.div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>
		</motion.div>
	);
}
