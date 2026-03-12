import { motion } from "motion/react";
import { Calendar, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useDirection } from "@base-ui/react";
import { useTranslation } from "@offline-sqlite/i18n";
import { Currency, formatCurrencyText } from "@/components/currency";
import { getEntityColor } from "@/utils/entity-colors";

interface ExpenseByMonth {
	month: string;
	totalAmount: number;
	count: number;
}

interface ExpenseByType {
	expenseTypeId: string;
	expenseTypeName: string;
	totalAmount: number;
	count: number;
}

interface ExpenseChartsProps {
	expensesByMonth: ExpenseByMonth[];
	expensesByType: ExpenseByType[];
}

export function ExpenseCharts({ expensesByMonth, expensesByType }: ExpenseChartsProps) {
	const { t } = useTranslation();
	const direction = useDirection();

	const formatAxisCurrency = (value: number) =>
		formatCurrencyText({ value, showCents: false }).replace(/\s+/g, " ");

	if (expensesByMonth.length === 0) return null;

	const pieChartData = expensesByType.map((item) => ({
		id: item.expenseTypeId,
		name: item.expenseTypeName,
		value: item.totalAmount,
		count: item.count,
	}));

	const maxTypeExpense = Math.max(...expensesByType.map((t) => t.totalAmount), 0);

	return (
		<div className="mb-6 grid gap-6 lg:grid-cols-2">
			<Card className="border-border/50">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
							<Calendar className="h-5 w-5 text-(--color-expenses)" />
						</div>
						<CardTitle className="text-sm font-medium">{t("expenses.byMonth")}</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<ChartContainer
						config={{
							expenses: { label: t("expenses.title") },
						}}
					>
						<BarChart data={expensesByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
							<CartesianGrid vertical={false} stroke="hsl(var(--border))" />
							<XAxis
								reversed={direction === "rtl"}
								dataKey="month"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(value: string) => {
									const [year, month] = value.split("-");
									return `${month}/${year?.slice(2)}`;
								}}
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
					{pieChartData.length === 0 ? (
						<div className="py-8 text-center">
							<p className="text-muted-foreground text-sm">{t("common.empty")}</p>
						</div>
					) : (
						<div className="space-y-3">
							{pieChartData.map((item, index) => (
								<motion.div
									key={item.name}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.05 }}
									className="group"
								>
									<div className="mb-1 flex items-center justify-between text-sm">
										<div className="flex items-center gap-2">
											<div
												className="h-3 w-3 rounded-full"
												style={{ backgroundColor: getEntityColor(item.id) }}
											/>
											<span className="font-medium">{item.name}</span>
											<span className="text-muted-foreground text-xs">
												({item.count})
											</span>
										</div>
										<span className="text-muted-foreground">
											<Currency value={item.value} />
										</span>
									</div>
									<div className="bg-muted h-2 w-full overflow-hidden rounded-full">
										<motion.div
											className="h-full rounded-full"
											style={{ backgroundColor: getEntityColor(item.id) }}
											initial={{ width: 0 }}
											animate={{
												width:
													maxTypeExpense > 0
														? `${(item.value / maxTypeExpense) * 100}%`
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
