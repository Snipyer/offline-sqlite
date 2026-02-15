import { Calendar, CreditCard, Phone, MapPin, User } from "lucide-react";
import { useState } from "react";
import { ToothDisplay } from "@/features/tooth-selector/components/tooth-display";
import { getVisitColor } from "@/utils/visit-colors";
import { Currency, formatDate, useTranslation } from "@offline-sqlite/i18n";
import { VisitHistoryItem } from "./visit-history-item";
import { useDirection } from "@base-ui/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
							{t("patients.unpaid")}: <Currency value={totalUnpaid} />
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
	payments: {
		id: string;
		visitId: string;
		amount: number;
		paymentMethod: string;
		notes: string | null;
		recordedAt: string | Date;
	}[];
}

export function PatientSheetContent({ patient, visits, totalUnpaid, payments }: PatientSheetProps) {
	const { t } = useTranslation();
	const [hoveredVisitId, setHoveredVisitId] = useState<string | null>(null);
	const direction = useDirection();
	const isRtl = direction === "rtl";

	const getAllVisitTeeth = () => {
		const teeth = new Set<string>();
		visits.forEach((visit) => {
			visit.acts.forEach((act) => {
				act.teeth.forEach((tooth) => teeth.add(tooth));
			});
		});
		return Array.from(teeth);
	};

	const getVisitTeeth = (visitId: string) => {
		const teeth = new Set<string>();
		const visit = visits.find((v) => v.id === visitId);
		if (visit) {
			visit.acts.forEach((act) => {
				act.teeth.forEach((tooth) => teeth.add(tooth));
			});
		}
		return Array.from(teeth);
	};

	const hasAnyTeeth = visits.some((visit) => visit.acts.some((act) => act.teeth.length > 0));

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="p-6">
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
							<p className="text-destructive text-center text-2xl font-bold">
								<Currency value={totalUnpaid} size="lg" />
							</p>
						</div>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-hidden">
				<Tabs defaultValue="visits" className="flex h-full flex-col">
					<div className="border-b px-6">
						<TabsList variant="line" className="h-10">
							<TabsTrigger value="visits">
								{t("patients.visitsTab")} ({visits.length})
							</TabsTrigger>
							<TabsTrigger value="payments">
								{t("patients.paymentsTab")} ({payments.length})
							</TabsTrigger>
						</TabsList>
					</div>
					<TabsContent value="visits" className="m-0 flex-1 overflow-y-auto p-6">
						<div className="space-y-4">
							{visits.length === 0 ? (
								<p className="text-muted-foreground text-sm">{t("patients.noVisits")}</p>
							) : (
								visits.map((visit) => (
									<div
										key={visit.id}
										className="relative"
										onMouseEnter={() => setHoveredVisitId(visit.id)}
										onMouseLeave={() => setHoveredVisitId(null)}
									>
										<div
											className={
												isRtl
													? "absolute top-0 right-0 bottom-0 w-1 rounded-r-xl"
													: "absolute top-0 bottom-0 left-0 w-1 rounded-l-xl"
											}
											style={{ backgroundColor: getVisitColor(visit.id) }}
										/>
										<div className={isRtl ? "pr-3" : "pl-3"}>
											<VisitHistoryItem visit={visit} patientId={patient.id} />
										</div>
									</div>
								))
							)}
						</div>
					</TabsContent>
					<TabsContent value="payments" className="m-0 flex-1 overflow-y-auto p-6">
						<div className="space-y-3">
							{payments.length === 0 ? (
								<p className="text-muted-foreground text-sm">{t("patients.noPayments")}</p>
							) : (
								payments.map((payment) => (
									<div
										key={payment.id}
										className="bg-card flex flex-col gap-2 rounded-lg border p-4"
									>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">
												<Currency value={payment.amount} />
											</span>
											<span className="text-muted-foreground text-xs uppercase">
												{formatDate(
													typeof payment.recordedAt === "string"
														? new Date(payment.recordedAt).getTime()
														: payment.recordedAt.getTime(),
												)}
											</span>
										</div>
										{payment.notes && (
											<span className="text-muted-foreground text-xs">
												{payment.notes}
											</span>
										)}
									</div>
								))
							)}
						</div>
					</TabsContent>
				</Tabs>
			</div>

			{hasAnyTeeth && (
				<div className="border-t p-2">
					<div className="mx-auto w-full max-w-96">
						<ToothDisplay
							highlightedTeeth={
								hoveredVisitId ? getVisitTeeth(hoveredVisitId) : getAllVisitTeeth()
							}
							highlightColor={hoveredVisitId ? getVisitColor(hoveredVisitId) : "var(--primary)"}
							hovered={!!hoveredVisitId}
							otherHovered={!!hoveredVisitId}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
