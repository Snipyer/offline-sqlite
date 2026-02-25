import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Loader2, Pencil, Plus, Trash2, X, Check, Syringe } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	getSubtleListItemTransition,
	pageContainerVariants,
	pageItemVariants,
	sectionFadeVariants,
	subtleListItemAnimate,
	subtleListItemInitial,
} from "@/lib/animations";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { PaginationControls } from "@/components/pagination-controls";

export default function VisitTypes() {
	const { t } = useTranslation();
	const [isCreating, setIsCreating] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formName, setFormName] = useState("");
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [sortBy, setSortBy] = useState<"createdDesc" | "createdAsc" | "nameAsc" | "nameDesc">(
		"createdDesc",
	);
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const visitTypes = useQuery(
		trpc.visitType.listPaginated.queryOptions({
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
		trpc.visitType.create.mutationOptions({
			onSuccess: () => {
				setPage(1);
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
				if ((visitTypes.data?.items.length ?? 0) <= 1 && page > 1) {
					setPage((prev) => Math.max(1, prev - 1));
				}
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
		setDeleteId(id);
	};

	const confirmDelete = () => {
		if (deleteId) {
			deleteMutation.mutate({ id: deleteId });
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
	};

	const clearFilters = () => {
		setQuery("");
		setSortBy("createdDesc");
	};

	const hasActiveFilters = query.trim().length > 0 || sortBy !== "createdDesc";

	const visitTypeSortLabelByValue: Record<typeof sortBy, string> = {
		createdDesc: t("visitTypes.sortNewest"),
		createdAsc: t("visitTypes.sortOldest"),
		nameAsc: t("visitTypes.sortNameAsc"),
		nameDesc: t("visitTypes.sortNameDesc"),
	};

	return (
		<motion.div
			id="visit-types-list-top"
			variants={pageContainerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-2xl px-4 py-8"
		>
			{/* Header */}
			<motion.div variants={pageItemVariants} className="mb-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
							<Syringe className="text-primary h-6 w-6" />
						</div>
						<div>
							<h1 className="text-3xl font-semibold tracking-tight">{t("visitTypes.title")}</h1>
							<p className="text-muted-foreground mt-1">{t("visitTypes.description")}</p>
						</div>
					</div>
					{!isCreating && (
						<Button onClick={() => setIsCreating(true)} className="gap-2">
							<Plus className="h-4 w-4" />
							{t("visitTypes.addNew")}
						</Button>
					)}
				</div>
			</motion.div>

			<motion.div variants={sectionFadeVariants}>
				<Card className="border-border/50 overflow-hidden">
					<CardContent className="p-6">
						<div className="space-y-4">
							<div className="mb-6 grid gap-4 sm:grid-cols-2">
								<div>
									<Label className="text-sm font-light">
										{t("visitTypes.searchLabel")}
									</Label>
									<Input
										value={query}
										onChange={(event) => setQuery(event.target.value)}
										placeholder={t("visitTypes.searchPlaceholder")}
										className="mt-1.5"
									/>
								</div>
								<div>
									<Label className="text-sm font-light">{t("listFilters.sortBy")}</Label>
									<Select
										value={sortBy}
										onValueChange={(value) => setSortBy(value as typeof sortBy)}
									>
										<SelectTrigger className="mt-1.5 w-full">
											<SelectValue>{visitTypeSortLabelByValue[sortBy]}</SelectValue>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="createdDesc">
												{t("visitTypes.sortNewest")}
											</SelectItem>
											<SelectItem value="createdAsc">
												{t("visitTypes.sortOldest")}
											</SelectItem>
											<SelectItem value="nameAsc">
												{t("visitTypes.sortNameAsc")}
											</SelectItem>
											<SelectItem value="nameDesc">
												{t("visitTypes.sortNameDesc")}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								{hasActiveFilters && (
									<div className="sm:col-span-2">
										<Button variant="ghost" size="sm" onClick={clearFilters}>
											{t("listFilters.clearFilters")}
										</Button>
									</div>
								)}
							</div>

							{isCreating && (
								<motion.form
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									onSubmit={handleCreate}
									className="border-border/50 bg-muted/30 mb-6 rounded-xl border p-4"
								>
									<div className="mb-4">
										<Label
											htmlFor="new-name"
											className="text-muted-foreground text-xs font-medium
												tracking-wider uppercase"
										>
											{t("visitTypes.nameLabel")}
										</Label>
										<Input
											id="new-name"
											value={formName}
											onChange={(e) => setFormName(e.target.value)}
											placeholder={t("visitTypes.namePlaceholder")}
											className="mt-1.5"
										/>
									</div>
									<div className="flex gap-2">
										<Button
											type="submit"
											disabled={createMutation.isPending || !formName.trim()}
											className="gap-2"
										>
											{createMutation.isPending ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Check className="h-4 w-4" />
											)}
											{t("common.save")}
										</Button>
										<Button type="button" variant="outline" onClick={cancelForm}>
											<X className="mr-2 h-4 w-4" />
											{t("common.cancel")}
										</Button>
									</div>
								</motion.form>
							)}

							{visitTypes.isLoading ? (
								<Loader className="h-32 pt-0" spinnerClassName="h-8 w-8" />
							) : (visitTypes.data?.items.length ?? 0) === 0 ? (
								<div className="flex flex-col items-center justify-center py-16 text-center">
									<div
										className="bg-muted/50 mb-4 flex h-20 w-20 items-center justify-center
											rounded-3xl"
									>
										<Syringe className="text-muted-foreground/50 h-10 w-10" />
									</div>
									<p className="text-muted-foreground text-sm">{t("visitTypes.empty")}</p>
								</div>
							) : (
								<div className="space-y-6">
									<div className="space-y-2">
										{visitTypes.data?.items.map((vt, index) =>
											editingId === vt.id ? (
												<motion.form
													key={vt.id}
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													onSubmit={handleUpdate}
													className="border-border/50 bg-muted/30 flex items-center
														gap-2 rounded-xl border p-3"
												>
													<Input
														value={formName}
														onChange={(e) => setFormName(e.target.value)}
														autoFocus
														className="flex-1"
													/>
													<Button
														type="submit"
														size="icon"
														className="h-9 w-9 rounded-lg"
														disabled={
															updateMutation.isPending || !formName.trim()
														}
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
														size="icon"
														className="h-9 w-9 rounded-lg"
														onClick={cancelForm}
													>
														<X className="h-4 w-4" />
													</Button>
												</motion.form>
											) : (
												<motion.div
													key={vt.id}
													initial={subtleListItemInitial}
													animate={subtleListItemAnimate}
													transition={getSubtleListItemTransition(index, 0.1, 0.05)}
													className="group border-border/50 hover:border-border
														bg-muted/30 hover:bg-card flex items-center
														justify-between rounded-xl border p-4
														transition-[background-color,border-color,box-shadow]
														duration-300"
												>
													<div className="flex items-center gap-3">
														<div
															className="flex h-8 w-8 items-center
																justify-center rounded-lg bg-violet-500/10"
														>
															<span
																className="text-xs font-semibold
																	text-violet-600"
															>
																{String.fromCharCode(65 + index)}
															</span>
														</div>
														<span className="font-medium">{vt.name}</span>
													</div>
													<div className="flex gap-1">
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 rounded-lg"
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
															className="text-destructive hover:text-destructive
																h-8 w-8 rounded-lg"
															disabled={deleteMutation.isPending}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</motion.div>
											),
										)}
									</div>
									<PaginationControls
										page={visitTypes.data?.page ?? 1}
										totalPages={visitTypes.data?.totalPages ?? 1}
										onPageChange={setPage}
										scrollTarget="visit-types-list-top"
									/>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</motion.div>

			<AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
				<AlertDialogContent onOverlayClick={() => setDeleteId(null)}>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("visitTypes.confirmDeleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("visitTypes.confirmDelete")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction variant="destructive" onClick={confirmDelete}>
							{deleteMutation.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</motion.div>
	);
}
