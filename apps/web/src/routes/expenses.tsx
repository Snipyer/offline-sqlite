import ExpensesPage from "@/features/expenses/components/expenses-page";
import { AuthGuard } from "@/components/auth-guard";

export default function ExpensesRoute() {
	return (
		<AuthGuard>
			<ExpensesPage />
		</AuthGuard>
	);
}
