import { useQuery } from "@tanstack/react-query";
import { Users, UserPlus, UserCheck, Syringe, Circle } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/loader";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { StatCard } from "@/features/daily-summary/components/stat-card";

interface DateRangeParams {
	startDate: string;
	endDate: string;
}

export function AnalyticsTab({ dateRange }: { dateRange: DateRangeParams }) {
	const { t } = useTranslation();

	const patientStats = useQuery(trpc.reports.getPatientStats.queryOptions(dateRange));

	const treatmentStats = useQuery(trpc.reports.getTreatmentStats.queryOptions(dateRange));

	if (patientStats.isLoading || treatmentStats.isLoading) {
		return <Loader />;
	}

	const patientData = patientStats.data;
	const treatmentData = treatmentStats.data;

	const topTreatments = treatmentData?.topTreatments ?? [];
	const topTeeth = treatmentData?.topTeeth ?? [];
	const maxCount = Math.max(...topTreatments.map((t) => t.count), 0);
	const maxToothCount = Math.max(...topTeeth.map((t) => t.count), 0);

	return (
		<div className="space-y-6">
			<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				<StatCard
					icon={UserPlus}
					title={t("reports.newPatients")}
					value={patientData?.newPatients ?? 0}
					subtitle={<span className="text-muted-foreground">{t("reports.inPeriod")}</span>}
					color="emerald"
				/>

				<StatCard
					icon={UserCheck}
					title={t("reports.returningPatients")}
					value={patientData?.returningPatients ?? 0}
					subtitle={<span className="text-muted-foreground">{t("reports.priorVisits")}</span>}
					color="blue"
				/>

				<StatCard
					icon={Users}
					title={t("reports.activePatients")}
					value={patientData?.activePatients ?? 0}
					subtitle={<span className="text-muted-foreground">{t("reports.withVisits")}</span>}
					color="violet"
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card className="border-border/50">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-3">
							<div
								className="flex h-10 w-10 items-center justify-center rounded-xl
									bg-violet-500/10"
							>
								<Syringe className="h-5 w-5 text-violet-500" />
							</div>
							<CardTitle className="text-sm font-medium">
								{t("reports.topTreatments")}
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						{topTreatments.length === 0 ? (
							<div className="py-8 text-center">
								<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
							</div>
						) : (
							<div className="space-y-3">
								{topTreatments.map((item, index) => (
									<motion.div
										key={item.treatment}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.05 }}
										className="group"
									>
										<div className="mb-1 flex items-center justify-between text-sm">
											<span className="font-medium">{item.treatment}</span>
											<span className="text-muted-foreground">
												{item.count} {t("reports.times")}
											</span>
										</div>
										<div className="bg-muted h-2 w-full overflow-hidden rounded-full">
											<motion.div
												className="h-full rounded-full bg-violet-500"
												initial={{ width: 0 }}
												animate={{
													width:
														maxCount > 0
															? `${(item.count / maxCount) * 100}%`
															: "0%",
												}}
												transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
											/>
										</div>
									</motion.div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-border/50">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-3">
							<div
								className="flex h-10 w-10 items-center justify-center rounded-xl
									bg-amber-500/10"
							>
								<Circle className="h-5 w-5 text-amber-500" />
							</div>
							<CardTitle className="text-sm font-medium">{t("reports.teethHeatmap")}</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						{topTeeth.length === 0 ? (
							<div className="py-8 text-center">
								<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
							</div>
						) : (
							<div className="grid grid-cols-8 gap-2">
								{Array.from({ length: 32 }, (_, i) => {
									const toothNumber = String(i + 1);
									const toothData = topTeeth.find((t) => t.toothId === toothNumber);
									const count = toothData?.count ?? 0;
									const intensity = maxToothCount > 0 ? count / maxToothCount : 0;

									return (
										<motion.div
											key={toothNumber}
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											transition={{ delay: 0.1 }}
											className="flex aspect-square items-center justify-center
												rounded-lg text-xs font-medium"
											style={{
												backgroundColor:
													count > 0
														? `rgba(245, 158, 11, ${0.1 + intensity * 0.9})`
														: "var(--muted)",
												color:
													count > 0
														? intensity > 0.5
															? "white"
															: "var(--foreground)"
														: "var(--muted-foreground)",
											}}
										>
											{toothNumber}
										</motion.div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
