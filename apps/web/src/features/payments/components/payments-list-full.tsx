import { useQuery } from "@tanstack/react-query";
import { Loader2, Filter, X, CreditCard, User, Calendar } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { Currency, formatDate, useTranslation } from "@offline-sqlite/i18n";

interface PaymentFilters {
	patientName: string;
}

const emptyFilters: PaymentFilters = {
	patientName: "",
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
		<div className="mx-auto w-full max-w-4xl py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">{t("payments.title")}</h1>
				<p className="text-muted-foreground mt-1">{t("payments.description")}</p>
			</div>

			<Card>
				<CardHeader className="pb-4">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">{t("payments.allPayments")}</CardTitle>
						<Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
							<Filter className="mr-2 h-4 w-4" />
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
						<div className="bg-card mb-6 rounded-lg border p-4">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-medium">{t("payments.filterPayments")}</h3>
								{hasActiveFilters && (
									<Button variant="ghost" size="sm" onClick={clearFilters}>
										<X className="mr-1 h-3 w-3" />
										{t("payments.clearFilters")}
									</Button>
								)}
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<Label className="text-sm">{t("payments.patient")}</Label>
									<Input
										value={filters.patientName}
										onChange={(e) =>
											setFilters((prev) => ({ ...prev, patientName: e.target.value }))
										}
										placeholder={t("payments.searchPatient")}
										className="mt-1.5"
									/>
								</div>
							</div>
						</div>
					)}

					{payments.isLoading ? (
						<div className="flex justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : payments.data?.length === 0 ? (
						<div className="py-12 text-center">
							<div className="mb-4 flex justify-center">
								<div
									className="bg-muted flex h-16 w-16 items-center justify-center
										rounded-full"
								>
									<CreditCard className="text-muted-foreground h-8 w-8" />
								</div>
							</div>
							<p className="text-muted-foreground">{t("payments.noPaymentsFound")}</p>
						</div>
					) : (
						<div className="space-y-4">
							{payments.data?.map((payment) => (
								<div
									key={payment.id}
									className="bg-card rounded-lg border p-5 transition-shadow
										hover:shadow-sm"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1">
											<div className="mb-3 flex items-center gap-3">
												<div
													className="bg-primary/10 flex h-10 w-10 items-center
														justify-center rounded-full"
												>
													<CreditCard className="text-primary h-5 w-5" />
												</div>
												<div>
													<h3 className="text-lg font-semibold">
														{payment.patientName}
													</h3>
													<p className="text-muted-foreground text-sm">
														{formatDate(new Date(payment.recordedAt).getTime())}
													</p>
												</div>
											</div>

											<div
												className="bg-muted/50 flex items-center gap-6 rounded-md px-4
													py-3"
											>
												<div className="flex items-center gap-2">
													<span className="text-muted-foreground text-sm">
														{t("payments.amount")}:
													</span>
													<span className="font-semibold">
														<Currency value={payment.amount} />
													</span>
												</div>
												<div className="bg-border h-4 w-px" />
												<div className="flex items-center gap-2">
													<span className="text-muted-foreground text-sm">
														{t("payments.method")}:
													</span>
													<span className="font-medium">{t("payments.cash")}</span>
												</div>
											</div>

											{payment.notes && (
												<p className="text-muted-foreground mt-3 text-sm">
													{payment.notes}
												</p>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
