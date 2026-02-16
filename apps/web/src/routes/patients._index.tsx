import { PatientsList } from "@/features/patients/components";
import { AuthGuard } from "@/components/auth-guard";

export default function PatientsPage() {
	return (
		<AuthGuard>
			<PatientsList />
		</AuthGuard>
	);
}
