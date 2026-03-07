import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Clock, Syringe, CalendarClock, Stethoscope, Users, User } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Currency } from "@/components/currency";
import Loader from "@/components/loader";
import { trpc } from "@/utils/trpc";
import { formatDate, useTranslation } from "@offline-sqlite/i18n";
import { VisitCard } from "@/features/visits/components/visit-card";
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

	const softDeleteMutation = useMutation(
		trpc.visit.softDelete.mutationOptions({
			onSuccess: () => summary.refetch(),
		}),
	);

	const handleDeleteVisit = (visitId: string) => {
		if (confirm(t("visits.confirmDelete"))) {
			softDeleteMutation.mutate({ id: visitId });
		}
	};

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
		upcomingSchedules,
		visits,
	} = summary.data;

	const now = Date.now();

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
						value={<Currency fontSize={30} value={totalCollected} />}
						subtitle={
							<span className="text-muted-foreground inline-flex items-center gap-1">
								{t("dailySummary.expected")}: <Currency value={totalExpected} size="sm" />
								<span className="mx-2">|</span>
								{t("dailySummary.unpaid")}: <Currency value={totalUnpaidAmount} size="sm" />
							</span>
						}
						color="blue"
					/>
				</motion.div>
			</div>

			<div className="space-y-6">
				<div className="grid gap-6 lg:grid-cols-2">
					<motion.div variants={sectionFadeVariants}>
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
													className="rounded-full bg-violet-500/10 px-2.5 py-0.5
														text-xs font-semibold text-violet-600"
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

					<motion.div variants={sectionFadeVariants}>
						<Card className="border-border/50 h-full overflow-hidden">
							<CardHeader className="pb-3">
								<div className="flex items-center gap-3">
									<div
										className="flex h-10 w-10 items-center justify-center rounded-xl
											bg-amber-500/10"
									>
										<CalendarClock className="h-5 w-5 text-amber-500" />
									</div>
									<CardTitle className="text-sm font-medium">
										{t("dailySummary.upcomingSchedules")}
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								{upcomingSchedules.length === 0 ? (
									<div
										className="flex flex-col items-center justify-center py-12
											text-center"
									>
										<div
											className="bg-muted/50 mb-3 flex h-16 w-16 items-center
												justify-center rounded-2xl"
										>
											<Clock className="text-muted-foreground/50 h-8 w-8" />
										</div>
										<p className="text-muted-foreground text-sm">
											{t("dailySummary.noUpcomingSchedules")}
										</p>
									</div>
								) : (
									<div className="space-y-2">
										{upcomingSchedules.map((schedule, index) => {
											const scheduledTime = new Date(schedule.scheduledTime);
											const timeLeftMinutes = Math.max(
												0,
												Math.ceil((scheduledTime.getTime() - now) / 60_000),
											);
											const timeLeftLabel = t("dailySummary.inMinutes", {
												minutes: timeLeftMinutes,
												unit: t("appointments.minutes"),
											});
											const visitTypeLabel =
												schedule.visitType?.name ?? t("common.empty");

											return (
												<motion.div
													key={schedule.id}
													initial={subtleListItemInitial}
													animate={subtleListItemAnimate}
													transition={getSubtleListItemTransition(
														index,
														0.35,
														0.05,
													)}
													className="border-border/60 bg-card/70 hover:border-border
														flex items-center gap-3 rounded-xl border border-l-2
														border-l-amber-500 px-3 py-2.5
														transition-[border-color]"
												>
													<p className="truncate text-sm font-semibold">
														<User className="mr-2 inline h-4 w-4" />
														{schedule.patient.name}
													</p>
													<p
														className="text-muted-foreground truncate text-right
															text-xs"
													>
														<Stethoscope className="mr-1 inline h-3 w-3" />
														{visitTypeLabel}
													</p>
													<div
														className="text-muted-foreground bg-muted inline-flex
															items-center justify-end gap-1 rounded-full px-2
															py-1 text-[11px] font-medium"
													>
														<Clock className="h-3 w-3" />
														<span>
															{timeLeftLabel} @{" "}
															{scheduledTime.toLocaleTimeString(undefined, {
																hour: "2-digit",
																minute: "2-digit",
																hour12: false,
															})}
														</span>
													</div>
												</motion.div>
											);
										})}
									</div>
								)}
							</CardContent>
						</Card>
					</motion.div>
				</div>

				<motion.div variants={sectionFadeVariants}>
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
										<VisitCard
											key={visit.id}
											visit={visit}
											index={index}
											showPatient
											editLink={`/visits/${visit.id}/edit`}
											onDelete={() => handleDeleteVisit(visit.id)}
											onPaymentSuccess={() => summary.refetch()}
											className="rounded-xl p-4"
										/>
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
