import { Calendar, CreditCard, Phone, MapPin, User } from "lucide-react";

import { ToothBadge } from "@/features/tooth-selector/components/tooth-selector";
import { useTranslation } from "@offline-sqlite/i18n";
import { VisitHistoryItem } from "./visit-history-item";

interface PatientCardProps {
	patient: {
		id: string;
		name: string;
		sex: "M" | "F";
		age: number;
		phone: string | null;
		address: string | null;
	};
	lastVisit: {
		visitTime: number;
	} | null;
	visits: { id: string }[];
	totalUnpaid: number;
	onClick: () => void;
}

const formatDate = (timestamp: number) => {
	return new Date(timestamp).toLocaleDateString();
};

export function PatientCard({ patient, lastVisit, visits, totalUnpaid, onClick }: PatientCardProps) {
	const { t } = useTranslation();

	return (
		<div
			className="bg-card hover:bg-card/80 cursor-pointer rounded-lg border p-5 transition-colors"
			onClick={onClick}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1">
					<div className="mb-3 flex items-center gap-3">
						<div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
							<User className="text-primary h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-semibold">{patient.name}</h3>
							<p className="text-muted-foreground text-sm">
								{t("patients.lastVisit")}:{" "}
								{lastVisit ? formatDate(lastVisit.visitTime) : t("patients.noVisits")}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap gap-4 text-sm">
						<div className="flex items-center gap-1">
							<span className="text-muted-foreground">{t("patients.age")}:</span>
							<span className="font-medium">{patient.age}</span>
						</div>
						<div className="flex items-center gap-1">
							<span className="text-muted-foreground">{t("patients.sex")}:</span>
							<span className="font-medium">
								{patient.sex === "M" ? t("patients.male") : t("patients.female")}
							</span>
						</div>
						{patient.phone && (
							<div className="flex items-center gap-1">
								<Phone className="text-muted-foreground h-3 w-3" />
								<span className="font-medium">{patient.phone}</span>
							</div>
						)}
					</div>

					{totalUnpaid > 0 && (
						<div
							className="bg-destructive/10 text-destructive mt-3 flex items-center gap-2
								rounded-md px-3 py-2 text-sm font-medium"
						>
							<CreditCard className="h-4 w-4" />
							{t("patients.unpaid")}: ${totalUnpaid}
						</div>
					)}
				</div>

				<div className="text-muted-foreground text-right text-sm">
					<div className="flex items-center gap-1">
						<Calendar className="h-3 w-3" />
						<span>
							{visits.length} {t("patients.visits")}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

interface PatientSheetProps {
	patient: {
		id: string;
		name: string;
		sex: "M" | "F";
		age: number;
		phone: string | null;
		address: string | null;
	};
	visits: {
		id: string;
		visitTime: number;
		notes: string | null;
		totalAmount: number;
		amountPaid: number;
		amountLeft: number;
		acts: {
			id: string;
			price: number;
			visitTypeId: string;
			visitType: { name: string };
			teeth: string[];
		}[];
	}[];
	totalUnpaid: number;
}

export function PatientSheetContent({ patient, visits, totalUnpaid }: PatientSheetProps) {
	const { t } = useTranslation();

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="border-b p-6">
				<div className="flex items-start gap-5">
					<div
						className="bg-primary/10 flex h-20 w-20 shrink-0 items-center justify-center
							rounded-2xl"
					>
						<User className="text-primary h-10 w-10" />
					</div>
					<div className="flex-1">
						<h2 className="text-2xl font-semibold tracking-tight">{patient.name}</h2>
						<div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
							<span className="text-muted-foreground">
								{patient.sex === "M" ? t("patients.male") : t("patients.female")},{" "}
								{patient.age} {t("patients.years")}
							</span>
							{patient.phone && (
								<span className="text-muted-foreground flex items-center gap-1.5">
									<Phone className="h-3.5 w-3.5" />
									{patient.phone}
								</span>
							)}
						</div>
						{patient.address && (
							<p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
								<MapPin className="h-3.5 w-3.5" />
								{patient.address}
							</p>
						)}
					</div>
					{totalUnpaid > 0 && (
						<div className="border-destructive/20 bg-destructive/10 rounded-xl border px-5 py-3">
							<p className="text-destructive text-center text-xs font-medium uppercase">
								{t("patients.unpaid")}
							</p>
							<p className="text-destructive text-center text-2xl font-bold">${totalUnpaid}</p>
						</div>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-6">
				<h3 className="mb-4 text-lg font-semibold">
					{t("patients.visitHistory")} ({visits.length})
				</h3>
				<div className="space-y-4">
					{visits.length === 0 ? (
						<p className="text-muted-foreground text-sm">{t("patients.noVisits")}</p>
					) : (
						visits.map((visit) => <VisitHistoryItem key={visit.id} visit={visit} />)
					)}
				</div>
			</div>
		</div>
	);
}
