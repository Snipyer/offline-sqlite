import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";

export default function VisitTypes() {
	const { t } = useTranslation();
	const [isCreating, setIsCreating] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formName, setFormName] = useState("");

	const visitTypes = useQuery(trpc.visitType.list.queryOptions());

	const createMutation = useMutation(
		trpc.visitType.create.mutationOptions({
			onSuccess: () => {
				visitTypes.refetch();
				setIsCreating(false);
				setFormName("");
			},
		}),
	);

	const updateMutation = useMutation(
		trpc.visitType.update.mutationOptions({
			onSuccess: () => {
				visitTypes.refetch();
				setEditingId(null);
				setFormName("");
			},
		}),
	);

	const deleteMutation = useMutation(
		trpc.visitType.delete.mutationOptions({
			onSuccess: () => {
				visitTypes.refetch();
			},
		}),
	);

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		if (formName.trim()) {
			createMutation.mutate({ name: formName.trim() });
		}
	};

	const handleUpdate = (e: React.FormEvent) => {
		e.preventDefault();
		if (editingId && formName.trim()) {
			updateMutation.mutate({ id: editingId, name: formName.trim() });
		}
	};

	const handleDelete = (id: string) => {
		if (confirm(t("visitTypes.confirmDelete"))) {
			deleteMutation.mutate({ id });
		}
	};

	const startEdit = (id: string, name: string) => {
		setEditingId(id);
		setFormName(name);
	};

	const cancelForm = () => {
		setIsCreating(false);
		setEditingId(null);
		setFormName("");
	};

	return (
		<div className="mx-auto w-full max-w-2xl py-10">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>{t("visitTypes.title")}</CardTitle>
						<CardDescription>{t("visitTypes.description")}</CardDescription>
					</div>
					{!isCreating && (
						<Button onClick={() => setIsCreating(true)}>
							<Plus className="mr-2 h-4 w-4" />
							{t("visitTypes.addNew")}
						</Button>
					)}
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{isCreating && (
							<form onSubmit={handleCreate} className="rounded-md border p-4">
								<div className="mb-4">
									<Label htmlFor="new-name">{t("visitTypes.nameLabel")}</Label>
									<Input
										id="new-name"
										value={formName}
										onChange={(e) => setFormName(e.target.value)}
										placeholder={t("visitTypes.namePlaceholder")}
										className="mt-1"
									/>
								</div>
								<div className="flex gap-2">
									<Button
										type="submit"
										disabled={createMutation.isPending || !formName.trim()}
									>
										{createMutation.isPending ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<Check className="mr-2 h-4 w-4" />
										)}
										{t("common.save")}
									</Button>
									<Button type="button" variant="outline" onClick={cancelForm}>
										<X className="mr-2 h-4 w-4" />
										{t("common.cancel")}
									</Button>
								</div>
							</form>
						)}

						{visitTypes.isLoading ? (
							<div className="flex justify-center py-4">
								<Loader2 className="h-6 w-6 animate-spin" />
							</div>
						) : visitTypes.data?.length === 0 ? (
							<p className="py-4 text-center">{t("visitTypes.empty")}</p>
						) : (
							<div className="space-y-2">
								{visitTypes.data?.map((vt) =>
									editingId === vt.id ? (
										<form
											key={vt.id}
											onSubmit={handleUpdate}
											className="flex items-center gap-2 rounded-md border p-2"
										>
											<Input
												value={formName}
												onChange={(e) => setFormName(e.target.value)}
												autoFocus
											/>
											<Button
												type="submit"
												size="sm"
												disabled={updateMutation.isPending || !formName.trim()}
											>
												{updateMutation.isPending ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Check className="h-4 w-4" />
												)}
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={cancelForm}
											>
												<X className="h-4 w-4" />
											</Button>
										</form>
									) : (
										<div
											key={vt.id}
											className="flex items-center justify-between rounded-md border
												p-3"
										>
											<span className="font-medium">{vt.name}</span>
											<div className="flex gap-1">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => startEdit(vt.id, vt.name)}
													aria-label={t("visitTypes.editAria")}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDelete(vt.id)}
													aria-label={t("visitTypes.deleteAria")}
													disabled={deleteMutation.isPending}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									),
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
