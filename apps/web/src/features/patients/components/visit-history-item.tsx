import { Calendar } from "lucide-react";

import { ToothBadge } from "@/features/tooth-selector/components/tooth-selector";
import { useTranslation } from "@offline-sqlite/i18n";

interface VisitHistoryItemProps {
	visit: {
		id: string;
		visitTime: number;
		notes: string | null;
		totalAmount: number;
		amountPaid: number;
		amountLeft: number;
		acts: {
			id: string;
			price: number;
			visitTypeId: string;
			visitType: { name: string };
			teeth: string[];
		}[];
	};
}

export function VisitHistoryItem({ visit }: VisitHistoryItemProps) {
	const { t } = useTranslation();

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString();
	};

	return (
		<div
			className="group bg-card hover:bg-card/80 relative overflow-hidden rounded-xl border p-4
				transition-colors"
		>
			<div className="mb-3">
				<div className="flex items-center gap-2">
					<Calendar className="text-primary h-4 w-4" />
					<span className="font-medium">{formatDate(visit.visitTime)}</span>
				</div>
				<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
					<span className="text-muted-foreground">
						{t("patients.total")}: <span className="font-medium">${visit.totalAmount}</span>
					</span>
					<span className="text-muted-foreground">
						{t("patients.paid")}: <span className="font-medium">${visit.amountPaid}</span>
					</span>
					<span
						className={
							visit.amountLeft > 0
								? "text-destructive font-medium"
								: "font-medium text-green-600 dark:text-green-400"
						}
					>
						{t("patients.left")}: ${visit.amountLeft}
					</span>
				</div>
			</div>

			{visit.acts.length > 0 && (
				<div className="space-y-2">
					{visit.acts.map((act, idx) => (
						<div
							key={idx}
							className="bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2.5"
						>
							<div className="flex items-center gap-3">
								<span className="text-muted-foreground w-5 text-sm">{idx + 1}.</span>
								<span className="font-medium">{act.visitType.name}</span>
								<ToothBadge teeth={act.teeth} />
							</div>
							<span className="font-semibold">${act.price}</span>
						</div>
					))}
				</div>
			)}

			{visit.notes && <p className="text-muted-foreground mt-3 border-t pt-3 text-sm">{visit.notes}</p>}
		</div>
	);
}
