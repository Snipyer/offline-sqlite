import Types from "@/features/types/components/types-list";
import { AuthGuard } from "@/components/auth-guard";

export default function TypesPage() {
	return (
		<AuthGuard>
			<Types />
		</AuthGuard>
	);
}
