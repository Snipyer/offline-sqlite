import {
	Calendar,
	AlertCircle,
	CheckCircle2,
	Pencil,
	Trash2,
	RotateCcw,
	Clock4,
	Stethoscope,
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { formatDate, formatTime, useTranslation } from "@offline-sqlite/i18n";
import { Currency } from "@/components/currency";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { getSubtleListItemTransition, subtleListItemAnimate, subtleListItemInitial } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { ToothBadge } from "@/features/tooth-selector/components/tooth-badge";
import { getEntityColor } from "@/utils/entity-colors";

export interface Visit {
	id: string;
	visitTime: number;
	totalAmount: number;
	amountPaid: number;
	amountLeft: number;
	isDeleted?: boolean;
	patient?: {
		id: string;
		name: string;
	};
	acts: {
		id: string;
		price: number;
		visitTypeId: string;
		notes: string | null;
		visitType: { name: string };
		teeth: string[];
	}[];
}

interface VisitCardProps {
	visit: Visit;
	patientId?: string;
	index?: number;
	showPatient?: boolean;
	showActions?: boolean;
	showPaymentAction?: boolean;
	showBorder?: boolean;
	borderColor?: string;
	isRtl?: boolean;
	editLink?: string;
	onEdit?: () => void;
	onDelete?: () => void;
	onRestore?: () => void;
	onPaymentSuccess?: () => void;
	className?: string;
}

export function VisitCard({
	visit,
	patientId,
	index = 0,
	showPatient = false,
	showActions = true,
	showPaymentAction = true,
	showBorder = false,
	borderColor,
	isRtl = false,
	editLink,
	onEdit,
	onDelete,
	onRestore,
	onPaymentSuccess,
	className,
}: VisitCardProps) {
	const { t } = useTranslation();
	const resolvedPatientId = patientId ?? visit.patient?.id;

	const content = (
		<motion.div
			initial={subtleListItemInitial}
			animate={subtleListItemAnimate}
			transition={getSubtleListItemTransition(index, 0, 0.05)}
			className={cn(
				`group border-border/50 hover:border-border bg-muted/30 hover:bg-card relative overflow-hidden
				rounded-2xl border p-5 transition-[background-color,border-color,box-shadow] duration-300`,
				visit.isDeleted && "opacity-60",
				className,
			)}
		>
			<div
				className="from-primary/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent
					to-transparent opacity-0 transition-opacity group-hover:opacity-100"
			/>

			<div className="relative">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-start gap-4">
						{showPatient && visit.patient && (
							<div
								className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center
									rounded-2xl"
							>
								<Stethoscope className="text-primary h-6 w-6" />
							</div>
						)}

						<div className="min-w-0 flex-1">
							{showPatient && visit.patient && (
								<div className="mb-1 flex items-center gap-2">
									<h3 className="truncate text-lg font-semibold">{visit.patient.name}</h3>
									{visit.isDeleted && (
										<span
											className="bg-destructive/10 text-destructive shrink-0
												rounded-full px-2 py-0.5 text-xs font-medium"
										>
											{t("visits.deletedMarker")}
										</span>
									)}
								</div>
							)}

							{(!showPatient || !visit.patient) && visit.isDeleted && (
								<div className="mb-1 flex items-center gap-2">
									<span
										className="bg-destructive/10 text-destructive shrink-0 rounded-full
											px-2 py-0.5 text-xs font-medium"
									>
										{t("visits.deletedMarker")}
									</span>
								</div>
							)}

							<div className="text-muted-foreground mb-2 flex items-center gap-3 text-sm">
								<div className="flex items-center gap-1">
									<Calendar className="h-3.5 w-3.5 shrink-0" />
									{formatDate(visit.visitTime)}
								</div>
								<div className="flex items-center gap-1">
									<Clock4 className="h-3.5 w-3.5 shrink-0" />
									{formatTime(visit.visitTime, {
										hour: "2-digit",
										minute: "2-digit",
										hour12: false,
									})}
								</div>
							</div>

							{visit.acts.length > 0 && (
								<div className="mb-2 space-y-1.5">
									{visit.acts.map((act) => (
										<div
											key={act.id}
											className="flex w-fit items-center justify-start gap-3 rounded-lg
												py-1.5"
										>
											<div
												className="h-2 w-2 shrink-0 rounded-full"
												style={{ backgroundColor: getEntityColor(act.visitTypeId) }}
											/>
											<p className="text-muted-foreground shrink-0 text-xs font-medium">
												{act.visitType.name}
											</p>
											<div className="[&>div]:flex-nowrap [&>div]:justify-end">
												<ToothBadge teeth={act.teeth} />
											</div>
											{act.notes && (
												<p
													className="text-muted-foreground/80 max-w-56 truncate
														text-[11px]"
												>
													{act.notes}
												</p>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{showActions && (
						<div className="flex shrink-0 gap-1">
							{showPaymentAction && !visit.isDeleted && patientId && visit.amountLeft > 0 && (
								<PaymentForm
									visitId={visit.id}
									totalAmount={visit.totalAmount}
									totalPaid={visit.amountPaid}
									patientId={patientId}
									onSuccess={onPaymentSuccess}
								>
									<Button variant="default" size="sm" className="mr-2 cursor-pointer">
										{t("payments.pay")}
									</Button>
								</PaymentForm>
							)}

							{!visit.isDeleted &&
								(editLink ? (
									<Link to={editLink}>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 rounded-lg"
											aria-label={t("visits.editVisitAction")}
										>
											<Pencil className="h-4 w-4" />
										</Button>
									</Link>
								) : onEdit ? (
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 rounded-lg"
										onClick={(e) => {
											e.stopPropagation();
											onEdit();
										}}
										aria-label={t("visits.editVisitAction")}
									>
										<Pencil className="h-4 w-4" />
									</Button>
								) : null)}

							{onRestore && visit.isDeleted ? (
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-lg"
									onClick={(e) => {
										e.stopPropagation();
										onRestore();
									}}
									aria-label={t("visits.restoreVisitAction")}
								>
									<RotateCcw className="h-4 w-4" />
								</Button>
							) : onDelete && !visit.isDeleted ? (
								<Button
									variant="ghost"
									size="icon"
									className="text-destructive hover:text-destructive h-8 w-8 rounded-lg"
									onClick={(e) => {
										e.stopPropagation();
										onDelete();
									}}
									aria-label={t("visits.deleteVisitAction")}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							) : null}
						</div>
					)}
				</div>

				<div className="border-border/50 mt-4 flex items-center justify-between border-t pt-4">
					{visit.amountLeft > 0 ? (
						<>
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-1.5">
									<div
										className="flex h-6 w-6 items-center justify-center rounded-lg
											bg-amber-500/10"
									>
										<AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
									</div>
									<span className="text-xs font-medium text-amber-600/70">
										{t("visits.remaining")}
									</span>
								</div>
								<span className="text-lg font-bold text-amber-600">
									<Currency value={visit.amountLeft} />
								</span>
								<span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
									<span aria-hidden="true">/</span>
									<Currency value={visit.totalAmount} size="sm" />
								</span>
							</div>
							{showPaymentAction && showPatient && !visit.isDeleted && resolvedPatientId && (
								<PaymentForm
									visitId={visit.id}
									totalAmount={visit.totalAmount}
									totalPaid={visit.amountPaid}
									patientId={resolvedPatientId}
									onSuccess={onPaymentSuccess}
								>
									<Button variant="default" size="sm" className="cursor-pointer">
										{t("payments.pay")}
									</Button>
								</PaymentForm>
							)}
						</>
					) : (
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-1.5">
								<div
									className="flex h-6 w-6 items-center justify-center rounded-lg
										bg-emerald-500/10"
								>
									<CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
								</div>
								<span className="text-xs font-medium text-emerald-600/70">
									{t("visits.paid")}
								</span>
							</div>
							<span className="text-lg font-bold text-emerald-600">
								<Currency value={visit.totalAmount} />
							</span>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);

	if (showBorder && borderColor) {
		return (
			<div className="relative">
				<div
					className={cn("absolute top-0 bottom-0 w-1 rounded-full", isRtl ? "right-0" : "left-0")}
					style={{ backgroundColor: borderColor }}
				/>
				<div className={isRtl ? "pr-3" : "pl-3"}>{content}</div>
			</div>
		);
	}

	return content;
}

export default VisitCard;
