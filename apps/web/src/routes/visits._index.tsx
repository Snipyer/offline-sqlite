import VisitsList from "@/features/visits/components/visits-list-full";
import { AuthGuard } from "@/components/auth-guard";

export default function VisitsPage() {
	return (
		<AuthGuard>
			<VisitsList />
		</AuthGuard>
	);
}
