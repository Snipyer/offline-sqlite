import { motion } from "motion/react";
import { Receipt, TrendingDown, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Currency } from "@/components/currency";
import { useTranslation } from "@offline-sqlite/i18n";
import { pageItemVariants } from "@/lib/animations";

interface ExpenseSummaryCardsProps {
	totalExpenses: number;
	totalCount: number;
	categoriesCount: number;
}

export function ExpenseSummaryCards({
	totalExpenses,
	totalCount,
	categoriesCount,
}: ExpenseSummaryCardsProps) {
	const { t } = useTranslation();

	return (
		<motion.div variants={pageItemVariants} className="mb-6 grid gap-4 sm:grid-cols-3">
			<Card className="border-border/50">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
							<TrendingDown className="h-5 w-5 text-rose-500" />
						</div>
						<CardTitle className="text-sm font-medium">{t("expenses.totalExpenses")}</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<Currency fontSize={24} value={totalExpenses} />
				</CardContent>
			</Card>

			<Card className="border-border/50">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
							<Receipt className="h-5 w-5 text-blue-500" />
						</div>
						<CardTitle className="text-sm font-medium">{t("expenses.count")}</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-semibold">{totalCount}</p>
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
						<CardTitle className="text-sm font-medium">{t("expenses.categories")}</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-2xl font-semibold">{categoriesCount}</p>
				</CardContent>
			</Card>
		</motion.div>
	);
}
