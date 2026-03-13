import { useQuery } from "@tanstack/react-query";
import {
	Users,
	UserPlus,
	UserCheck,
	Syringe,
	Activity,
	PieChart as PieChartIcon,
	CalendarDays,
	Medal,
	Wallet,
	TrendingDown,
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/loader";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { StatCard } from "@/features/daily-summary/components/stat-card";
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Currency, formatCurrencyText } from "@/components/currency";
import { chartConfig } from "./chart-config";
import { toSupportedLanguage } from "@offline-sqlite/i18n";
import { useDirection } from "@base-ui/react";
import { getEntityColor } from "@/utils/entity-colors";

interface DateRangeParams {
	startDate: string;
	endDate: string;
}

export function AnalyticsTab({ dateRange }: { dateRange: DateRangeParams }) {
	const { t, i18n } = useTranslation();
	const direction = useDirection();
	const formatAxisCurrency = (value: number) =>
		formatCurrencyText({ value, showCents: false }).replace(/\s+/g, " ");
	const currentLanguage = toSupportedLanguage(String(i18n.resolvedLanguage ?? i18n.language ?? "en"));

	const patientStats = useQuery(trpc.reports.getPatientStats.queryOptions(dateRange));

	const treatmentStats = useQuery(trpc.reports.getTreatmentStats.queryOptions(dateRange));
	const patientAnalytics = useQuery(trpc.reports.getPatientAnalytics.queryOptions(dateRange));

	if (patientStats.isLoading || treatmentStats.isLoading || patientAnalytics.isLoading) {
		return <Loader />;
	}

	const patientData = patientStats.data;
	const treatmentData = treatmentStats.data;
	const analyticsData = patientAnalytics.data;

	const topTreatments = (treatmentData?.topTreatments ?? []).slice(0, 7);
	const topPatientsByVisits = analyticsData?.topPatientsByVisits ?? [];
	const topPatientsByPaid = analyticsData?.topPatientsByPaid ?? [];
	const topPatientsByDebt = analyticsData?.topPatientsByDebt ?? [];
	const visitsByWeekday = analyticsData?.visitsByWeekday ?? [];
	const treatmentsByWeekday = analyticsData?.treatmentsByWeekday ?? [];
	const maxCount = Math.max(...topTreatments.map((t) => t.count), 0);
	const maxTopVisits = Math.max(...topPatientsByVisits.map((item) => item.value), 0);
	const maxTopPaid = Math.max(...topPatientsByPaid.map((item) => item.value), 0);
	const maxTopDebt = Math.max(...topPatientsByDebt.map((item) => item.value), 0);

	const genderPieData = [
		{
			key: "male",
			label: t("patients.male"),
			value: analyticsData?.genderDistribution.M ?? 0,
			fill: "var(--color-male)",
		},
		{
			key: "female",
			label: t("patients.female"),
			value: analyticsData?.genderDistribution.F ?? 0,
			fill: "var(--color-female)",
		},
	].filter((item) => item.value > 0);

	const weekdayLocaleByLanguage = {
		en: "en-US",
		fr: "fr-FR",
		ar: "ar",
	} as const;

	const weekdayLabelFormatter = new Intl.DateTimeFormat(weekdayLocaleByLanguage[currentLanguage], {
		weekday: "short",
	});

	const withWeekdayLabel = (item: { dayIndex: number; count: number }) => {
		const baseSunday = new Date(Date.UTC(2024, 0, 7));
		baseSunday.setUTCDate(baseSunday.getUTCDate() + item.dayIndex);
		const localizedLabel = weekdayLabelFormatter.format(baseSunday);
		const normalizedLabel =
			currentLanguage === "ar"
				? localizedLabel
				: localizedLabel.replace(/\.$/, "").replace(/^./, (char) => char.toUpperCase());

		return {
			...item,
			label: normalizedLabel,
		};
	};

	const visitsWeekdayChartData = visitsByWeekday.map(withWeekdayLabel);
	const treatmentsWeekdayChartData = treatmentsByWeekday.map(withWeekdayLabel);

	const topPatientSections = [
		{
			icon: Medal,
			title: t("reports.topPatientsByVisits"),
			data: topPatientsByVisits,
			maxValue: maxTopVisits,
			colorClass: "bg-(--color-visits)",
			iconClass: "text-(--color-visits)",
			isCurrency: false,
			valueFormatter: (value: number) => `${value} ${t("reports.times")}`,
		},
		{
			icon: Wallet,
			title: t("reports.topPatientsByPaid"),
			data: topPatientsByPaid,
			maxValue: maxTopPaid,
			colorClass: "bg-(--color-revenue)",
			iconClass: "text-(--color-revenue)",
			isCurrency: true,
			valueFormatter: (value: number) => formatAxisCurrency(value),
		},
		{
			icon: TrendingDown,
			title: t("reports.topPatientsByDebt"),
			data: topPatientsByDebt,
			maxValue: maxTopDebt,
			colorClass: "bg-(--color-unpaid)",
			iconClass: "text-(--color-unpaid)",
			isCurrency: true,
			valueFormatter: (value: number) => formatAxisCurrency(value),
		},
	];

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
							<div className="bg-muted flex h-10 w-10 items-center justify-center rounded-xl">
								<PieChartIcon className="h-5 w-5 text-(--color-male)" />
							</div>
							<CardTitle className="text-sm font-medium">
								{t("reports.genderDistribution")}
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						{genderPieData.length === 0 ? (
							<div className="py-8 text-center">
								<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
							</div>
						) : (
							<div className="grid justify-center gap-4">
								<ChartContainer config={chartConfig} className="aspect-square h-55">
									<PieChart>
										<ChartTooltip
											content={
												<ChartTooltipContent
													nameKey="label"
													formatter={(value, _name, item) => (
														<span>
															{item.payload.label}: {Number(value)}
														</span>
													)}
												/>
											}
										/>
										<Pie
											data={genderPieData}
											dataKey="value"
											nameKey="label"
											innerRadius={56}
											outerRadius={86}
											paddingAngle={3}
										>
											{genderPieData.map((entry) => (
												<Cell key={entry.key} fill={entry.fill} />
											))}
										</Pie>
										<ChartLegend
											verticalAlign="bottom"
											formatter={(value, _entry, index) => {
												const count = genderPieData[index]?.value ?? 0;
												return `${value} (${count})`;
											}}
										/>
									</PieChart>
								</ChartContainer>
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-border/50">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-3">
							<div className="bg-muted flex h-10 w-10 items-center justify-center rounded-xl">
								<CalendarDays className="h-5 w-5 text-(--color-visits)" />
							</div>
							<CardTitle className="text-sm font-medium">
								{t("reports.visitsByWeekday")}
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						{visitsWeekdayChartData.every((item) => item.count === 0) ? (
							<div className="py-8 text-center">
								<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
							</div>
						) : (
							<ChartContainer config={chartConfig}>
								<BarChart
									data={visitsWeekdayChartData}
									margin={{ top: 5, right: 8, left: -6, bottom: 0 }}
								>
									<CartesianGrid vertical={false} stroke="hsl(var(--border))" />
									<XAxis
										reversed={direction === "rtl"}
										dataKey="label"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
									/>
									<YAxis
										allowDecimals={false}
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										orientation={direction === "rtl" ? "right" : "left"}
									/>
									<ChartTooltip content={<ChartTooltipContent />} />
									<Bar
										dataKey="count"
										name={t("reports.totalVisits")}
										fill="var(--color-visits)"
										radius={4}
									/>
								</BarChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>

				<Card className="border-border/50">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-3">
							<div
								className="bg-treatment/10 flex h-10 w-10 items-center justify-center
									rounded-xl"
							>
								<Syringe className="h-5 w-5 text-(--color-treatment)" />
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
										key={item.visitTypeId}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.05 }}
										className="group"
									>
										<div className="mb-1 flex items-center justify-between text-sm">
											<div className="flex items-center gap-2">
												<div
													className="h-3 w-3 rounded-full"
													style={{
														backgroundColor: getEntityColor(item.visitTypeId),
													}}
												/>
												<span className="font-medium capitalize">
													{item.treatment}
												</span>
											</div>
											<span className="text-muted-foreground">
												{item.count} {t("reports.times")}
											</span>
										</div>
										<div className="bg-muted h-2 w-full overflow-hidden rounded-full">
											<motion.div
												className="h-full rounded-full"
												style={{
													backgroundColor: getEntityColor(item.visitTypeId),
												}}
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
							<div className="bg-muted flex h-10 w-10 items-center justify-center rounded-xl">
								<Activity className="h-5 w-5 text-(--color-treatment)" />
							</div>
							<CardTitle className="text-sm font-medium">
								{t("reports.totalTreatments")}
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						{treatmentsWeekdayChartData.every((item) => item.count === 0) ? (
							<div className="py-8 text-center">
								<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
							</div>
						) : (
							<ChartContainer config={chartConfig}>
								<LineChart
									data={treatmentsWeekdayChartData}
									margin={{ top: 5, right: 8, left: -6, bottom: 0 }}
								>
									<CartesianGrid vertical={false} stroke="hsl(var(--border))" />
									<XAxis
										reversed={direction === "rtl"}
										dataKey="label"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
									/>
									<YAxis
										allowDecimals={false}
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										orientation={direction === "rtl" ? "right" : "left"}
									/>
									<ChartTooltip content={<ChartTooltipContent />} />
									<Line
										type="monotone"
										dataKey="count"
										name={t("reports.totalTreatments")}
										stroke="var(--color-treatment)"
										strokeWidth={3}
										dot={{ r: 4, fill: "var(--color-treatment)" }}
										activeDot={{ r: 6 }}
									/>
								</LineChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{topPatientSections.map((section) => (
					<Card key={section.title} className="border-border/50">
						<CardHeader className="pb-3">
							<div className="flex items-center gap-3">
								<div
									className="bg-muted/70 flex h-10 w-10 items-center justify-center
										rounded-xl"
								>
									<section.icon className={`h-5 w-5 ${section.iconClass}`} />
								</div>
								<CardTitle className="text-sm font-medium">{section.title}</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							{section.data.length === 0 ? (
								<div className="py-8 text-center">
									<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
								</div>
							) : (
								<div className="space-y-3">
									{section.data.map((item, index) => (
										<motion.div
											key={`${section.title}-${item.patientId}`}
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05 }}
										>
											<div
												className="mb-1 flex items-center justify-between gap-3
													text-sm"
											>
												<p className="truncate font-medium">{item.name}</p>
												{section.isCurrency ? (
													<Currency value={item.value} size="sm" />
												) : (
													<span className="text-muted-foreground text-xs">
														{section.valueFormatter(item.value)}
													</span>
												)}
											</div>
											<div className="bg-muted h-2 w-full overflow-hidden rounded-full">
												<motion.div
													className={`h-full rounded-full ${section.colorClass}`}
													initial={{ width: 0 }}
													animate={{
														width:
															section.maxValue > 0
																? `${(item.value / section.maxValue) * 100}%`
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
				))}
			</div>
		</div>
	);
}
