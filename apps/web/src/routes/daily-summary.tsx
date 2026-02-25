import { AuthGuard } from "@/components/auth-guard";
import DailySummaryContent from "@/features/daily-summary/components/daily-summary-content";

export default function DailySummaryPage() {
	return (
		<AuthGuard>
			<DailySummaryContent />
		</AuthGuard>
	);
}
