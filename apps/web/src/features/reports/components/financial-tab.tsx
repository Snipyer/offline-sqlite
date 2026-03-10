import { useQuery } from "@tanstack/react-query";
import { DollarSign, CreditCard, TrendingUp, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Currency, formatCurrencyText } from "@/components/currency";
import Loader from "@/components/loader";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { StatCard } from "@/features/daily-summary/components/stat-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { chartConfig } from "./chart-config";
import { useDirection } from "@base-ui/react";

interface DateRangeParams {
	startDate: string;
	endDate: string;
}

export function FinancialTab({ dateRange }: { dateRange: DateRangeParams }) {
	const { t } = useTranslation();
	const direction = useDirection();

	const formatAxisCurrency = (value: number) =>
		formatCurrencyText({ value, showCents: false }).replace(/\s+/g, " ");

	const summary = useQuery(trpc.reports.getSummary.queryOptions(dateRange));
	const revenueByTreatment = useQuery(trpc.reports.getRevenueByTreatment.queryOptions(dateRange));
	const revenueByPeriod = useQuery(trpc.reports.getRevenueByPeriod.queryOptions(dateRange));

	const isLoading = summary.isLoading || revenueByTreatment.isLoading || revenueByPeriod.isLoading;

	const summaryData = summary.data;
	const treatmentData = revenueByTreatment.data || [];
	const periodData = revenueByPeriod.data || [];

	const maxRevenue = Math.max(...treatmentData.map((t) => t.revenue), 0);

	const formattedPeriodData = periodData.slice(-14).map((item) => {
		const date = new Date(item.period);
		return {
			...item,
			unpaid: item.unpaid ?? 0,
			label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
		};
	});

	if (isLoading) {
		return <Loader />;
	}

	return (
		<div className="space-y-6">
			<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					icon={DollarSign}
					title={t("reports.totalRevenue")}
					value={<Currency fontSize={30} value={summaryData?.totalRevenue ?? 0} />}
					subtitle={<span className="text-muted-foreground">{t("reports.collected")}</span>}
					color="emerald"
				/>

				<StatCard
					icon={Calendar}
					title={t("reports.totalVisits")}
					value={summaryData?.totalVisits ?? 0}
					subtitle={<span className="text-muted-foreground">{t("reports.inPeriod")}</span>}
					color="blue"
				/>

				<StatCard
					icon={TrendingUp}
					title={t("reports.avgPerVisit")}
					value={<Currency fontSize={30} value={summaryData?.avgPerVisit ?? 0} />}
					subtitle={<span className="text-muted-foreground">{t("reports.average")}</span>}
					color="violet"
				/>

				<StatCard
					icon={CreditCard}
					title={t("reports.outstanding")}
					value={<Currency fontSize={30} value={summaryData?.outstanding ?? 0} />}
					subtitle={<span className="text-muted-foreground">{t("reports.unpaid")}</span>}
					color="amber"
				/>
			</div>

			{formattedPeriodData.length > 0 && (
				<div className="grid gap-6 lg:grid-cols-2">
					<Card className="border-border/50">
						<CardHeader className="pb-3">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl
										bg-(--color-revenue)/10"
								>
									<TrendingUp className="h-5 w-5 text-(--color-revenue)" />
								</div>
								<CardTitle className="text-sm font-medium">
									{t("reports.revenueTrend")}
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<ChartContainer config={chartConfig}>
								<BarChart
									data={formattedPeriodData}
									margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
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
										tickLine={false}
										axisLine={false}
										width={92}
										tick={{ fontSize: 10 }}
										tickMargin={6}
										tickFormatter={(value) => formatAxisCurrency(Number(value))}
										orientation={direction === "rtl" ? "right" : "left"}
									/>
									<ChartTooltip
										content={
											<ChartTooltipContent
												formatter={(value) => (
													<span>{formatAxisCurrency(Number(value))}</span>
												)}
											/>
										}
									/>
									<Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
								</BarChart>
							</ChartContainer>
						</CardContent>
					</Card>

					<Card className="border-border/50">
						<CardHeader className="pb-3">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl
										bg-(--color-unpaid)/10"
								>
									<CreditCard className="h-5 w-5 text-(--color-unpaid)" />
								</div>
								<CardTitle className="text-sm font-medium">
									{t("reports.outstanding")}
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<ChartContainer config={chartConfig}>
								<LineChart
									data={formattedPeriodData}
									margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
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
										tickLine={false}
										axisLine={false}
										width={92}
										tick={{ fontSize: 10 }}
										tickMargin={6}
										tickFormatter={(value) => formatAxisCurrency(Number(value))}
										orientation={direction === "rtl" ? "right" : "left"}
									/>
									<ChartTooltip
										content={
											<ChartTooltipContent
												formatter={(value) => (
													<span>{formatAxisCurrency(Number(value))}</span>
												)}
											/>
										}
									/>
									<Line
										type="linear"
										dataKey="unpaid"
										stroke="var(--color-unpaid)"
										strokeWidth={2}
										dot={true}
									/>
								</LineChart>
							</ChartContainer>
						</CardContent>
					</Card>
				</div>
			)}

			<Card className="border-border/50">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-3">
						<div
							className="flex h-10 w-10 items-center justify-center rounded-xl
								bg-(--color-treatment)/10"
						>
							<DollarSign className="h-5 w-5 text-(--color-treatment)" />
						</div>
						<CardTitle className="text-sm font-medium">
							{t("reports.revenueByTreatment")}
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					{treatmentData.length === 0 ? (
						<div className="py-8 text-center">
							<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
						</div>
					) : (
						<div className="space-y-3">
							{treatmentData.map((item, index) => (
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
											<Currency value={item.revenue} />
										</span>
									</div>
									<div className="bg-muted h-2 w-full overflow-hidden rounded-full">
										<motion.div
											className="h-full rounded-full bg-(--color-treatment)"
											initial={{ width: 0 }}
											animate={{
												width:
													maxRevenue > 0
														? `${(item.revenue / maxRevenue) * 100}%`
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
		</div>
	);
}
