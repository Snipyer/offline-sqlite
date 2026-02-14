import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { trpc } from "@/utils/trpc";
import { PatientSheetContent } from "./patient-card";

interface PatientSheetProps {
	patientId: string | null;
	onClose: () => void;
}

export function PatientSheet({ patientId, onClose }: PatientSheetProps) {
	const patientDetails = useQuery({
		...trpc.patient.getByIdWithVisits.queryOptions({ id: patientId! }, { enabled: !!patientId }),
	});

	return (
		<Sheet
			open={!!patientId}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<SheetContent
				side="right"
				className="inset-y-0! flex h-full! w-[95vw] max-w-200! flex-col border-l pt-6"
			>
				{patientDetails.isLoading ? (
					<div className="flex flex-1 items-center justify-center">
						<Loader2 className="h-6 w-6 animate-spin" />
					</div>
				) : patientDetails.data ? (
					<PatientSheetContent
						patient={patientDetails.data.patient}
						visits={patientDetails.data.visits}
						totalUnpaid={patientDetails.data.totalUnpaid}
					/>
				) : null}
			</SheetContent>
		</Sheet>
	);
}
