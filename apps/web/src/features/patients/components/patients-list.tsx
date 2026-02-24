import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { User, Users, Filter, X } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import { pageContainerVariants, pageItemVariants, sectionFadeVariants } from "@/lib/animations";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { PatientCard } from "@/components/patient-card";
import { PatientsFilter, type PatientFilters } from "./patients-filter";
import { PatientSheet } from "./patient-sheet";
import { cn } from "@/lib/utils";

const emptyFilters: PatientFilters = {
	sex: "",
	dateFrom: "",
	dateTo: "",
	visitTypeId: "",
	hasUnpaid: false,
	name: "",
};

export function PatientsList() {
	const { t } = useTranslation();
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<PatientFilters>(emptyFilters);
	const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

	const visitTypes = useQuery(trpc.visitType.list.queryOptions());

	const patients = useQuery({
		...trpc.patient.listWithFilters.queryOptions({
			sex: filters.sex ? (filters.sex as "M" | "F") : undefined,
			dateFrom: filters.dateFrom ? new Date(filters.dateFrom).getTime() : undefined,
			dateTo: filters.dateTo ? new Date(filters.dateTo).getTime() : undefined,
			visitTypeId: filters.visitTypeId || undefined,
			hasUnpaid: filters.hasUnpaid || undefined,
			name: filters.name || undefined,
		}),
		enabled: true,
	});

	const clearFilters = () => {
		setFilters(emptyFilters);
	};

	const hasActiveFilters = Boolean(
		filters.sex ||
		filters.dateFrom ||
		filters.dateTo ||
		filters.visitTypeId ||
		filters.hasUnpaid ||
		filters.name,
	);

	return (
		<motion.div
			variants={pageContainerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-5xl px-4 py-8"
		>
			{/* Header */}
			<motion.div variants={pageItemVariants} className="mb-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
							<Users className="text-primary h-6 w-6" />
						</div>
						<div>
							<h1 className="text-3xl font-semibold tracking-tight">{t("patients.title")}</h1>
							<p className="text-muted-foreground mt-1">{t("patients.description")}</p>
						</div>
					</div>
				</div>
			</motion.div>

			<motion.div variants={sectionFadeVariants}>
				<Card className="border-border/50 overflow-hidden">
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div
									className="flex h-10 w-10 items-center justify-center rounded-xl
										bg-violet-500/10"
								>
									<User className="h-5 w-5 text-violet-500" />
								</div>
								<CardTitle className="text-base font-semibold">
									{t("patients.allPatients")}
								</CardTitle>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowFilters(!showFilters)}
								className="gap-2"
							>
								<Filter className="h-4 w-4" />
								{t("patients.filters")}
								{hasActiveFilters && (
									<span
										className="bg-primary text-primary-foreground ml-2 rounded-full px-2
											py-0.5 text-xs"
									>
										!
									</span>
								)}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{showFilters && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="border-border/50 bg-muted/30 mb-6 rounded-xl border p-4"
							>
								<div className="mb-4 flex items-center justify-between">
									<h3 className="font-medium">{t("patients.filterPatients")}</h3>
									{hasActiveFilters && (
										<Button
											variant="ghost"
											size="sm"
											onClick={clearFilters}
											className="gap-1"
										>
											<X className="h-3 w-3" />
											{t("patients.clearFilters")}
										</Button>
									)}
								</div>
								<PatientsFilter
									filters={filters}
									onFilterChange={setFilters}
									visitTypes={visitTypes.data ?? []}
									hasActiveFilters={hasActiveFilters}
									onClearFilters={clearFilters}
									showFilters={showFilters}
									onToggleFilters={() => setShowFilters(!showFilters)}
								/>
							</motion.div>
						)}

						{patients.isLoading ? (
							<Loader className="h-64 pt-0" />
						) : patients.data?.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 text-center">
								<div
									className="bg-muted/50 mb-4 flex h-20 w-20 items-center justify-center
										rounded-3xl"
								>
									<User className="text-muted-foreground/50 h-10 w-10" />
								</div>
								<h3 className="mb-1 text-base font-semibold">
									{t("patients.noPatientsFound")}
								</h3>
								<p className="text-muted-foreground max-w-xs text-sm">
									{hasActiveFilters
										? t("patients.tryClearingFilters")
										: t("patients.noPatientsDescription")}
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{patients.data?.map((data, index) => (
									<PatientCard
										key={data.patient.id}
										patient={data.patient}
										lastVisit={data.lastVisit}
										visits={data.visits}
										totalUnpaid={data.totalUnpaid}
										onClick={() => setSelectedPatientId(data.patient.id)}
										index={index}
									/>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</motion.div>

			<PatientSheet patientId={selectedPatientId} onClose={() => setSelectedPatientId(null)} />
		</motion.div>
	);
}

export default function PatientsPage() {
	return <PatientsList />;
}
