import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Plus, Syringe, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pageContainerVariants, pageItemVariants } from "@/lib/animations";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { TypeFilters, type SortOption } from "./type-filters";
import { TypeCreateForm } from "./type-create-form";
import { TypeListItems } from "./type-list-items";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import Loader from "@/components/loader";

interface TypeListProps {
	type: "visit" | "expense";
	showCreate: boolean;
	onCreateClose: () => void;
}

function TypeList({ type, showCreate, onCreateClose }: TypeListProps) {
	const [isCreating, setIsCreating] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	useEffect(() => {
		if (showCreate) {
			setIsCreating(true);
		}
	}, [showCreate]);

	const [formName, setFormName] = useState("");
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("createdDesc");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const router = type === "visit" ? trpc.visitType : trpc.expenseType;

	const types = useQuery(
		router.listPaginated.queryOptions({
			query: query || undefined,
			sortBy,
			page,
			pageSize,
		}),
	);

	useEffect(() => {
		setPage(1);
	}, [query, sortBy]);

	const createMutation = useMutation(
		router.create.mutationOptions({
			onSuccess: () => {
				setPage(1);
				types.refetch();
				setIsCreating(false);
				setFormName("");
			},
		}) as any,
	);

	const updateMutation = useMutation(
		router.update.mutationOptions({
			onSuccess: () => {
				types.refetch();
				setEditingId(null);
				setFormName("");
			},
		}) as any,
	);

	const deleteMutation = useMutation(
		router.delete.mutationOptions({
			onSuccess: () => {
				if ((types.data?.items.length ?? 0) <= 1 && page > 1) {
					setPage((prev) => Math.max(1, prev - 1));
				}
				types.refetch();
			},
		}) as any,
	);

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		if (formName.trim()) {
			createMutation.mutate({ name: formName.trim() } as any);
		}
	};

	const handleUpdate = (e: React.FormEvent) => {
		e.preventDefault();
		if (editingId && formName.trim()) {
			updateMutation.mutate({ id: editingId, name: formName.trim() } as any);
		}
	};

	const handleDelete = (id: string) => {
		setDeleteId(id);
	};

	const confirmDelete = () => {
		if (deleteId) {
			deleteMutation.mutate({ id: deleteId } as any);
			setDeleteId(null);
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
		onCreateClose();
	};

	return (
		<div>
			<Card className="border-border/50 overflow-hidden">
				<CardContent className="p-6">
					<div className="space-y-4">
						<TypeFilters
							type={type}
							query={query}
							sortBy={sortBy}
							onQueryChange={setQuery}
							onSortChange={setSortBy}
						/>

						<TypeCreateForm
							type={type}
							isCreating={isCreating}
							formName={formName}
							isPending={createMutation.isPending}
							onFormNameChange={setFormName}
							onSubmit={handleCreate}
							onCancel={cancelForm}
						/>

						{types.isLoading ? (
							<Loader className="h-32 pt-0" spinnerClassName="h-8 w-8" />
						) : (
							<TypeListItems
								type={type}
								items={types.data?.items ?? []}
								page={types.data?.page ?? 1}
								totalPages={types.data?.totalPages ?? 1}
								editingId={editingId}
								editFormName={formName}
								isEditPending={updateMutation.isPending}
								isDeletePending={deleteMutation.isPending}
								onPageChange={setPage}
								onStartEdit={startEdit}
								onEditFormNameChange={setFormName}
								onEditSubmit={handleUpdate}
								onEditCancel={cancelForm}
								onDelete={handleDelete}
							/>
						)}
					</div>
				</CardContent>
			</Card>

			<DeleteConfirmDialog
				type={type}
				isOpen={!!deleteId}
				isPending={deleteMutation.isPending}
				onOpenChange={(open) => !open && setDeleteId(null)}
				onConfirm={confirmDelete}
			/>
		</div>
	);
}

export default function VisitTypes() {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState<"visit" | "expense">("visit");
	const [showCreate, setShowCreate] = useState(false);

	return (
		<motion.div
			id="types-list-top"
			variants={pageContainerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-2xl px-4 py-8"
		>
			<motion.div variants={pageItemVariants} className="mb-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
							{activeTab === "visit" ? (
								<Syringe className="text-primary h-6 w-6" />
							) : (
								<Receipt className="text-primary h-6 w-6" />
							)}
						</div>
						<div>
							<h1 className="text-3xl font-semibold tracking-tight">
								{activeTab === "visit" ? t("visitTypes.title") : t("expenseTypes.title")}
							</h1>
							<p className="text-muted-foreground mt-1">
								{activeTab === "visit"
									? t("visitTypes.description")
									: t("expenseTypes.description")}
							</p>
						</div>
					</div>
					<Button onClick={() => setShowCreate(true)} className="gap-2">
						<Plus className="h-4 w-4" />
						{t(`${activeTab}Types.addNew`)}
					</Button>
				</div>
			</motion.div>

			<Tabs
				value={activeTab}
				onValueChange={(v) => {
					setActiveTab(v as "visit" | "expense");
					setShowCreate(false);
				}}
			>
				<motion.div variants={pageItemVariants} className="border-border border-b mb-2">
					<TabsList variant="line" className="h-10">
						<TabsTrigger value="visit" className="gap-2">
							<Syringe className="h-4 w-4" />
							{t("visitTypes.title")}
						</TabsTrigger>
						<TabsTrigger value="expense" className="gap-2">
							<Receipt className="h-4 w-4" />
							{t("expenseTypes.title")}
						</TabsTrigger>
					</TabsList>
				</motion.div>

				<TabsContent value="visit">
					<TypeList
						type="visit"
						showCreate={showCreate && activeTab === "visit"}
						onCreateClose={() => setShowCreate(false)}
					/>
				</TabsContent>
				<TabsContent value="expense">
					<TypeList
						type="expense"
						showCreate={showCreate && activeTab === "expense"}
						onCreateClose={() => setShowCreate(false)}
					/>
				</TabsContent>
			</Tabs>
		</motion.div>
	);
}
