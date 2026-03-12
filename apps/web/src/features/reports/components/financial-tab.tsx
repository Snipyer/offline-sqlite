import { useQuery } from "@tanstack/react-query";
import { DollarSign, CreditCard, TrendingUp, TrendingDown, Calendar, PieChart } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Currency, formatCurrencyText } from "@/components/currency";
import Loader from "@/components/loader";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { StatCard } from "@/features/daily-summary/components/stat-card";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts";
import { chartConfig } from "./chart-config";
import { useDirection } from "@base-ui/react";
import { getEntityColor } from "@/utils/entity-colors";

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

	const totalExpenses = useQuery(
		trpc.expense.getTotalExpenses.queryOptions({
			dateFrom: new Date(dateRange.startDate).getTime(),
			dateTo: new Date(dateRange.endDate).getTime(),
		}),
	);
	const expensesByPeriod = useQuery(
		trpc.expense.getExpensesByPeriod.queryOptions({
			dateFrom: new Date(dateRange.startDate).getTime(),
			dateTo: new Date(dateRange.endDate).getTime(),
		}),
	);
	const expensesByType = useQuery(
		trpc.expense.getExpensesByType.queryOptions({
			dateFrom: new Date(dateRange.startDate).getTime(),
			dateTo: new Date(dateRange.endDate).getTime(),
		}),
	);

	const isLoading =
		summary.isLoading ||
		revenueByTreatment.isLoading ||
		revenueByPeriod.isLoading ||
		totalExpenses.isLoading ||
		expensesByPeriod.isLoading ||
		expensesByType.isLoading;

	const summaryData = summary.data;
	const treatmentData = revenueByTreatment.data || [];
	const periodData = revenueByPeriod.data || [];
	const expensesData = totalExpenses.data;

	const totalRevenue = summaryData?.totalRevenue ?? 0;
	const totalExpensesAmount = expensesData?.total ?? 0;
	const netIncome = totalRevenue - totalExpensesAmount;

	const maxRevenue = Math.max(...treatmentData.map((t) => t.revenue), 0);

	const formattedPeriodData = periodData.slice(-14).map((item) => {
		const date = new Date(item.period);
		return {
			...item,
			unpaid: item.unpaid ?? 0,
			label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
		};
	});

	const expensesByTypeData = expensesByType?.data ?? [];
	const maxTypeExpense = Math.max(
		...expensesByTypeData.map((t: { totalAmount: number }) => t.totalAmount),
		0,
	);

	if (isLoading) {
		return <Loader />;
	}

	return (
		<div className="space-y-6">
			<div className="grid gap-5 sm:grid-cols-3">
				<StatCard
					icon={DollarSign}
					title={t("reports.totalRevenue")}
					value={<Currency fontSize={30} value={totalRevenue} />}
					subtitle={<span className="text-muted-foreground">{t("reports.collected")}</span>}
					color="emerald"
				/>

				<StatCard
					icon={TrendingDown}
					title={t("reports.totalExpenses")}
					value={<Currency fontSize={30} value={totalExpensesAmount} />}
					subtitle={<span className="text-muted-foreground">{t("reports.inPeriod")}</span>}
					color="amber"
				/>

				<StatCard
					icon={netIncome >= 0 ? TrendingUp : TrendingDown}
					title={t("reports.netIncome")}
					value={<Currency fontSize={30} value={netIncome} />}
					subtitle={
						<span className="text-muted-foreground">
							{netIncome >= 0 ? t("reports.profit") : t("reports.loss")}
						</span>
					}
					color={netIncome >= 0 ? "emerald" : "amber"}
				/>
			</div>

			<div className="grid gap-5 sm:grid-cols-3">
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
				<Card className="border-border/50">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-3">
							<div
								className="flex h-10 w-10 items-center justify-center rounded-xl
									bg-emerald-500/10"
							>
								<TrendingUp className="h-5 w-5 text-emerald-500" />
							</div>
							<CardTitle className="text-sm font-medium">
								{t("reports.revenueVsExpenses")}
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<ChartContainer
							config={{
								revenue: { label: t("reports.revenue") },
								expenses: { label: t("expenses.title") },
							}}
							className="aspect-auto h-62.5 w-full"
						>
							<AreaChart
								data={formattedPeriodData.map((item, index) => {
									const expenseItem = expensesByPeriod.data?.[index];
									return {
										...item,
										expenses: expenseItem?.totalAmount ?? 0,
									};
								})}
								margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
							>
								<defs>
									<linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
										<stop
											offset="5%"
											stopColor="var(--color-revenue)"
											stopOpacity={0.8}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-revenue)"
											stopOpacity={0.1}
										/>
									</linearGradient>
									<linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
										<stop
											offset="5%"
											stopColor="var(--color-expenses)"
											stopOpacity={0.8}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-expenses)"
											stopOpacity={0.1}
										/>
									</linearGradient>
								</defs>
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
									content={<ChartTooltipContent className="p-2" indicator="dot" />}
								/>
								<Area
									type="natural"
									dataKey="expenses"
									fill="url(#fillExpenses)"
									stroke="var(--color-expenses)"
									strokeWidth={2}
								/>
								<Area
									type="natural"
									dataKey="revenue"
									fill="url(#fillRevenue)"
									stroke="var(--color-revenue)"
									strokeWidth={2}
								/>
								<ChartLegend content={<ChartLegendContent />} />
							</AreaChart>
						</ChartContainer>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				<Card className="border-border/50">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-3">
							<div
								className="bg-revenue/10 flex h-10 w-10 items-center justify-center
									rounded-xl"
							>
								<TrendingUp className="h-5 w-5 text-(--color-revenue)" />
							</div>
							<CardTitle className="text-sm font-medium">{t("reports.revenueTrend")}</CardTitle>
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
									bg-rose-500/10"
							>
								<Calendar className="h-5 w-5 text-(--color-expenses)" />
							</div>
							<CardTitle className="text-sm font-medium">{t("expenses.trend")}</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						{(expensesByPeriod.data?.length ?? 0) > 0 ? (
							<ChartContainer
								config={{
									expenses: { label: t("expenses.title") },
								}}
							>
								<BarChart
									data={expensesByPeriod.data?.slice(-14).map((item) => {
										const date = new Date(item.period);
										return {
											...item,
											label: date.toLocaleDateString(undefined, {
												month: "short",
												day: "numeric",
											}),
										};
									})}
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
									<Bar dataKey="totalAmount" fill="var(--color-expenses)" radius={4} />
								</BarChart>
							</ChartContainer>
						) : (
							<div className="py-8 text-center">
								<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
							</div>
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

				<Card className="border-border/50">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-3">
							<div
								className="flex h-10 w-10 items-center justify-center rounded-xl
									bg-emerald-500/10"
							>
								<PieChart className="h-5 w-5 text-emerald-500" />
							</div>
							<CardTitle className="text-sm font-medium">{t("expenses.byType")}</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						{expensesByTypeData.length === 0 ? (
							<div className="py-8 text-center">
								<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
							</div>
						) : (
							<div className="space-y-3">
								{expensesByTypeData.map((item, index) => (
									<motion.div
										key={item.expenseTypeId}
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
														backgroundColor: getEntityColor(item.expenseTypeId),
													}}
												/>
												<span className="font-medium">{item.expenseTypeName}</span>
												<span className="text-muted-foreground text-xs">
													({item.count})
												</span>
											</div>
											<span className="text-muted-foreground">
												<Currency value={item.totalAmount} />
											</span>
										</div>
										<div className="bg-muted h-2 w-full overflow-hidden rounded-full">
											<motion.div
												className="h-full rounded-full"
												style={{
													backgroundColor: getEntityColor(item.expenseTypeId),
												}}
												initial={{ width: 0 }}
												animate={{
													width:
														maxTypeExpense > 0
															? `${(item.totalAmount / maxTypeExpense) * 100}%`
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
		</div>
	);
}
