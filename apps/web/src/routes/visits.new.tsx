import VisitForm from "@/features/visits/components/visit-form";
import { AuthGuard } from "@/components/auth-guard";

export default function NewVisitPage() {
	return (
		<AuthGuard>
			<VisitForm mode="create" />
		</AuthGuard>
	);
}
