import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import VisitForm from "@/features/visits/components/visit-form";
import { VisitTypeDialog } from "@/features/visits/components/visit-type-dialog";
import { trpc } from "@/utils/trpc";
import { AuthGuard } from "@/components/auth-guard";

export default function NewVisitPage() {
	const queryClient = useQueryClient();
	const [isCreatingType, setIsCreatingType] = useState(false);
	const [newTypeName, setNewTypeName] = useState("");

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

	return (
		<AuthGuard>
			<VisitForm mode="create" onAddNewType={() => setIsCreatingType(true)} />
			<VisitTypeDialog
				isOpen={isCreatingType}
				newTypeName={newTypeName}
				setNewTypeName={setNewTypeName}
				isPending={createTypeMutation.isPending}
				onOpenChange={setIsCreatingType}
				onSubmit={handleCreateType}
			/>
		</AuthGuard>
	);
}
