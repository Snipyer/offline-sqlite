import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import VisitForm from "@/features/visits/components/visit-form";
import { VisitTypeDialog } from "@/features/visits/components/visit-type-dialog";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { AuthGuard } from "@/components/auth-guard";

export default function EditVisitPage() {
	return (
		<AuthGuard>
			<EditVisitContent />
		</AuthGuard>
	);
}

function EditVisitContent() {
	const { id } = useParams();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [isCreatingType, setIsCreatingType] = useState(false);
	const [newTypeName, setNewTypeName] = useState("");

	const visitQuery = useQuery(trpc.visit.getById.queryOptions({ id: id! }));

	const createTypeMutation = useMutation(
		trpc.visitType.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.visitType.list.queryKey() });
				setIsCreatingType(false);
				setNewTypeName("");
			},
		}),
	);

	const handleCreateType = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTypeName.trim()) return;
		createTypeMutation.mutate({ name: newTypeName.trim() });
	};

	if (!visitQuery.data) {
		return (
			<div className="container mx-auto py-8">
				<h1>{t("visits.visitNotFound")}</h1>
			</div>
		);
	}

	return (
		<>
			<VisitForm mode="edit" visit={visitQuery.data} onAddNewType={() => setIsCreatingType(true)} />
			<VisitTypeDialog
				isOpen={isCreatingType}
				newTypeName={newTypeName}
				setNewTypeName={setNewTypeName}
				isPending={createTypeMutation.isPending}
				onOpenChange={setIsCreatingType}
				onSubmit={handleCreateType}
			/>
		</>
	);
}
