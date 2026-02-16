import PaymentsList from "@/features/payments/components/payments-list-full";
import { AuthGuard } from "@/components/auth-guard";

export default function PaymentsPage() {
	return (
		<AuthGuard>
			<PaymentsList />
		</AuthGuard>
	);
}
