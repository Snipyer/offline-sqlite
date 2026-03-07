import AppointmentsPage from "@/features/appointments/components/appointments-page";
import { AuthGuard } from "@/components/auth-guard";

export default function Appointments() {
	return (
		<AuthGuard>
			<AppointmentsPage />
		</AuthGuard>
	);
}
