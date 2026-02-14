import { useQuery } from "@tanstack/react-query";
import { Loader2, User } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { PatientCard } from "./patient-card";
import { PatientsFilter, FilterToggle, type PatientFilters } from "./patients-filter";
import { PatientSheet } from "./patient-sheet";

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
		<div className="mx-auto w-full max-w-4xl py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{t("patients.title")}</h1>
					<p className="text-muted-foreground mt-1">{t("patients.description")}</p>
				</div>
			</div>

			<Card>
				<CardHeader className="pb-4">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">{t("patients.allPatients")}</CardTitle>
						<FilterToggle
							showFilters={showFilters}
							onToggle={() => setShowFilters(!showFilters)}
							hasActiveFilters={hasActiveFilters}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{showFilters && (
						<div className="bg-card mb-6 rounded-lg border p-4">
							<PatientsFilter
								filters={filters}
								onFilterChange={setFilters}
								visitTypes={visitTypes.data ?? []}
								hasActiveFilters={hasActiveFilters}
								onClearFilters={clearFilters}
								showFilters={showFilters}
								onToggleFilters={() => setShowFilters(!showFilters)}
							/>
						</div>
					)}

					{patients.isLoading ? (
						<div className="flex justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : patients.data?.length === 0 ? (
						<div className="py-12 text-center">
							<div className="mb-4 flex justify-center">
								<div
									className="bg-muted flex h-16 w-16 items-center justify-center
										rounded-full"
								>
									<User className="text-muted-foreground h-8 w-8" />
								</div>
							</div>
							<p className="text-muted-foreground mb-4">{t("patients.noPatientsFound")}</p>
						</div>
					) : (
						<div className="space-y-4">
							{patients.data?.map((data) => (
								<PatientCard
									key={data.patient.id}
									patient={data.patient}
									lastVisit={data.lastVisit}
									visits={data.visits}
									totalUnpaid={data.totalUnpaid}
									onClick={() => setSelectedPatientId(data.patient.id)}
								/>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<PatientSheet patientId={selectedPatientId} onClose={() => setSelectedPatientId(null)} />
		</div>
	);
}

export default function PatientsPage() {
	return <PatientsList />;
}
