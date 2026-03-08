import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDirection } from "@/components/ui/direction";
import { trpc } from "@/utils/trpc";
import { PatientSheetContent } from "./patient-card-content";
import Loader from "@/components/loader";

interface PatientSheetProps {
	patientId: string | null;
	onClose: () => void;
	onEdit?: (patientId: string) => void;
}

export function PatientSheet({ patientId, onClose, onEdit }: PatientSheetProps) {
	const direction = useDirection();
	const patientDetails = useQuery({
		...trpc.patient.getByIdWithVisits.queryOptions({ id: patientId! }, { enabled: !!patientId }),
	});
	const patientPayments = useQuery({
		...trpc.payment.listByPatient.queryOptions({ patientId: patientId! }, { enabled: !!patientId }),
	});

	return (
		<Sheet
			open={!!patientId}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<SheetContent
				side={direction === "rtl" ? "left" : "right"}
				dir={direction}
				className="inset-y-0! flex h-full! w-[95vw] max-w-150! flex-col border-l pt-6"
			>
				{patientDetails.isLoading ? (
					<div className="flex flex-1 items-center justify-center">
						<Loader />
					</div>
				) : patientDetails.data ? (
					<PatientSheetContent
						patient={patientDetails.data.patient}
						visits={patientDetails.data.visits}
						totalUnpaid={patientDetails.data.totalUnpaid}
						appointments={patientDetails.data.appointments}
						payments={patientPayments.data ?? []}
						onEdit={onEdit ? () => onEdit(patientId!) : undefined}
					/>
				) : null}
			</SheetContent>
		</Sheet>
	);
}
