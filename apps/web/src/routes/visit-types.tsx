import VisitTypes from "@/features/visit-types/components/visit-types-list";
import { AuthGuard } from "@/components/auth-guard";

export default function VisitTypesPage() {
	return (
		<AuthGuard>
			<VisitTypes />
		</AuthGuard>
	);
}
