import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Clock, CreditCard, Users, Syringe } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Currency } from "@/components/currency";
import Loader from "@/components/loader";
import { trpc } from "@/utils/trpc";
import { formatDate, useTranslation } from "@offline-sqlite/i18n";
import { ToothBadge } from "@/features/tooth-selector/components/tooth-badge";
import {
	getSubtleListItemTransition,
	pageContainerVariants,
	pageItemVariants,
	sectionFadeVariants,
	subtleListItemAnimate,
	subtleListItemInitial,
} from "@/lib/animations";
import { StatCard } from "./stat-card";

export default function DailySummaryContent() {
	const { t } = useTranslation();
	const summary = useQuery(trpc.dailySummary.get.queryOptions());

	if (summary.isLoading) {
		return <Loader />;
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
		totalUnpaidAmount,
		proceduresByType,
		visits,
	} = summary.data;

	return (
		<motion.div
			variants={pageContainerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-6xl px-4 py-8"
		>
			<motion.div variants={pageItemVariants} className="mb-8">
				<h1 className="mb-1 text-2xl font-semibold tracking-tight">{t("dailySummary.title")}</h1>
				<p className="text-muted-foreground text-sm">
					{formatDate(new Date(date).getTime(), "full")}
				</p>
			</motion.div>

			<div className="mb-8 grid gap-5 sm:grid-cols-2">
				<motion.div variants={pageItemVariants}>
					<StatCard
						icon={Calendar}
						title={t("dailySummary.todayVisits")}
						value={totalVisits}
						subtitle={
							<span className="text-muted-foreground">
								{uniquePatients} {t("dailySummary.patients")}
								{newPatientsToday > 0 && (
									<span className="ml-2 text-emerald-600">
										({newPatientsToday} {t("dailySummary.new")})
									</span>
								)}
							</span>
						}
						color="emerald"
					/>
				</motion.div>

				<motion.div variants={pageItemVariants}>
					<StatCard
						icon={DollarSign}
						title={t("dailySummary.dailyIncome")}
						value={<Currency className="text-3xl!" value={totalCollected} />}
						subtitle={
							<span className="text-muted-foreground">
								{t("dailySummary.expected")}: <Currency value={totalExpected} size="sm" />
								<span className="mx-2">|</span>
								{t("dailySummary.unpaid")}: <Currency value={totalUnpaidAmount} size="sm" />
							</span>
						}
						color="blue"
					/>
				</motion.div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<motion.div variants={sectionFadeVariants} className="lg:col-span-1">
					<Card className="border-border/50 h-full overflow-hidden">
						<CardHeader className="pb-3">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl
										bg-violet-500/10"
								>
									<Syringe className="h-5 w-5 text-violet-500" />
								</div>
								<CardTitle className="text-sm font-medium">
									{t("dailySummary.proceduresBreakdown")}
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							{Object.keys(proceduresByType).length === 0 ? (
								<div className="py-8 text-center">
									<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
								</div>
							) : (
								<div className="space-y-2">
									{Object.entries(proceduresByType).map(([type, count], index) => (
										<motion.div
											key={type}
											initial={subtleListItemInitial}
											animate={subtleListItemAnimate}
											transition={getSubtleListItemTransition(index, 0.3, 0.05)}
											className="hover:border-border/50 hover:bg-muted/30 flex
												items-center justify-between rounded-lg border
												border-transparent p-3 transition-colors"
										>
											<div className="flex items-center gap-2">
												<Syringe className="text-muted-foreground h-4 w-4" />
												<span className="text-sm">{type}</span>
											</div>
											<span
												className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs
													font-semibold text-violet-600"
											>
												{count}
											</span>
										</motion.div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>

				<motion.div variants={sectionFadeVariants} className="lg:col-span-2">
					<Card className="border-border/50 h-full overflow-hidden">
						<CardHeader className="pb-3">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl
										bg-blue-500/10"
								>
									<Users className="h-5 w-5 text-blue-500" />
								</div>
								<CardTitle className="text-sm font-medium">
									{t("dailySummary.todayVisitsList")}
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							{visits.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<div
										className="bg-muted/50 mb-3 flex h-16 w-16 items-center justify-center
											rounded-2xl"
									>
										<Clock className="text-muted-foreground/50 h-8 w-8" />
									</div>
									<p className="text-muted-foreground text-sm">
										{t("dailySummary.noVisitsToday")}
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{visits.map((visit, index) => (
										<motion.div
											key={visit.id}
											initial={subtleListItemInitial}
											animate={subtleListItemAnimate}
											transition={getSubtleListItemTransition(index, 0.4, 0.08)}
											className="group border-border/50 hover:border-border bg-muted/30
												hover:bg-card relative overflow-hidden rounded-xl border p-4
												transition-[background-color,border-color,box-shadow]
												duration-300"
										>
											<div
												className="from-primary/5 pointer-events-none absolute inset-0
													bg-linear-to-br via-transparent to-transparent opacity-0
													transition-opacity group-hover:opacity-100"
											/>

											<div className="relative">
												<div className="mb-3 flex items-start justify-between">
													<div className="flex items-center gap-3">
														<div
															className="bg-primary/10 flex h-10 w-10
																items-center justify-center rounded-full"
														>
															<Users className="text-primary h-5 w-5" />
														</div>
														<div>
															<h4 className="text-base font-semibold">
																{visit.patient.name}
															</h4>
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
																className="bg-background/50 flex items-center
																	justify-between rounded-lg px-3 py-2
																	text-sm"
															>
																<div className="flex items-center gap-2">
																	<span className="text-muted-foreground">
																		{idx + 1}.
																	</span>
																	<span>{act.visitType.name}</span>
																	<ToothBadge
																		teeth={act.teeth}
																		maxTeeth={4}
																	/>
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
														<span className="font-semibold">
															<Currency value={visit.totalAmount} size="sm" />
														</span>
													</div>
													<Link
														to={`/visits/${visit.id}/edit`}
														className="text-primary hover:text-primary/80 text-sm
															font-medium hover:underline"
													>
														{t("common.edit")}
													</Link>
												</div>
											</div>
										</motion.div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>
			</div>
		</motion.div>
	);
}
