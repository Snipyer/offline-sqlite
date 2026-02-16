import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, DollarSign, Clock, CreditCard, Users, Syringe } from "lucide-react";
import { Link } from "react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { Currency, formatDate, useTranslation } from "@offline-sqlite/i18n";
import { ToothBadge } from "@/features/tooth-selector/components/tooth-selector";

export default function DailySummaryPage() {
	const { t } = useTranslation();
	const summary = useQuery(trpc.dailySummary.get.queryOptions());

	if (summary.isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!summary.data) {
		return null;
	}

	const {
		date,
		totalVisits,
		uniquePatients,
		newPatientsToday,
		totalCollected,
		totalExpected,
		totalRemaining,
		totalUnpaidAmount,
		proceduresByType,
		visits,
	} = summary.data;

	return (
		<div className="container mx-auto max-w-6xl px-4 py-6">
			<div className="mb-6">
				<h1 className="mb-1 text-2xl font-bold">{t("dailySummary.title")}</h1>
				<p className="text-muted-foreground">{formatDate(new Date(date).getTime(), "full")}</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">{t("dailySummary.todayVisits")}</CardTitle>
						<Calendar className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalVisits}</div>
						<p className="text-muted-foreground text-xs">
							{uniquePatients} {t("dailySummary.patients")}
							{newPatientsToday > 0 && (
								<span className="ml-1 text-green-600">
									({newPatientsToday} {t("dailySummary.new")})
								</span>
							)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">{t("dailySummary.dailyIncome")}</CardTitle>
						<DollarSign className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							<Currency value={totalCollected} />
						</div>
						<p className="text-muted-foreground text-xs">
							{t("dailySummary.expected")}: <Currency value={totalExpected} size="sm" />
							<span className="mx-2">|</span>
							{t("dailySummary.unpaid")}: <Currency value={totalUnpaidAmount} size="sm" />
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="mt-6 grid gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle className="text-lg">{t("dailySummary.proceduresBreakdown")}</CardTitle>
					</CardHeader>
					<CardContent>
						{Object.keys(proceduresByType).length === 0 ? (
							<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
						) : (
							<div className="space-y-3">
								{Object.entries(proceduresByType).map(([type, count]) => (
									<div key={type} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Syringe className="text-muted-foreground h-4 w-4" />
											<span className="text-sm">{type}</span>
										</div>
										<span className="font-semibold">{count}</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="text-lg">{t("dailySummary.todayVisitsList")}</CardTitle>
					</CardHeader>
					<CardContent>
						{visits.length === 0 ? (
							<div className="py-8 text-center">
								<Clock className="text-muted-foreground mx-auto h-8 w-8" />
								<p className="text-muted-foreground mt-2 text-sm">
									{t("dailySummary.noVisitsToday")}
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{visits.map((visit) => (
									<div key={visit.id} className="bg-muted/50 rounded-lg p-4">
										<div className="mb-3 flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div
													className="bg-primary/10 flex h-10 w-10 items-center
														justify-center rounded-full"
												>
													<Users className="text-primary h-5 w-5" />
												</div>
												<div>
													<h4 className="font-semibold text-lg">{visit.patient.name}</h4>
													<p className="text-muted-foreground text-xs">
														{formatDate(visit.visitTime)}
													</p>
												</div>
											</div>
											<div className="text-right">
												<div className="font-semibold">
													<Currency value={visit.amountPaid} />
												</div>
												<p className="text-muted-foreground text-xs">
													{t("visits.amountLeft")}:{" "}
													<Currency value={visit.amountLeft} size="sm" />
												</p>
											</div>
										</div>

										{visit.acts.length > 0 && (
											<div className="mb-3 space-y-1">
												{visit.acts.map((act, idx) => (
													<div
														key={idx}
														className="flex items-center justify-between text-sm"
													>
														<div className="flex items-center gap-2">
															<span className="text-muted-foreground">
																{idx + 1}.
															</span>
															<span>{act.visitType.name}</span>
															<ToothBadge teeth={act.teeth} maxTeeth={4} />
														</div>
														<Currency value={act.price} size="sm" />
													</div>
												))}
											</div>
										)}

										<div
											className="flex items-center justify-between border-t pt-3
												text-sm"
										>
											<div className="flex items-center gap-2">
												<CreditCard className="text-muted-foreground h-4 w-4" />
												<span className="text-muted-foreground">
													{t("visits.totalAmount")}:
												</span>
												<Currency value={visit.totalAmount} size="sm" />
											</div>
											<Link
												to={`/visits/${visit.id}/edit`}
												className="text-primary text-sm font-medium hover:underline"
											>
												{t("common.edit")}
											</Link>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
