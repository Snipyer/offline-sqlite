import { AuthGuard } from "@/components/auth-guard";
import ReportsPage from "@/features/reports/components/reports-page";

export default function ReportsRoute() {
	return (
		<AuthGuard>
			<ReportsPage />
		</AuthGuard>
	);
}
