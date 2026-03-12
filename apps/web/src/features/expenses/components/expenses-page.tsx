import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Plus, Receipt } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { pageContainerVariants, pageItemVariants, sectionFadeVariants } from "@/lib/animations";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { ExpenseSummaryCards } from "./expense-summary-cards";
import { ExpenseFilters } from "./expense-filters";
import { ExpenseForm } from "./expense-form";
import { ExpenseList } from "./expense-list";
import { ExpenseDeleteDialog } from "./expense-delete-dialog";
import { ExpenseTypeDialog } from "./expense-type-dialog";
import type { ExpenseItem } from "./expense-list";

export default function ExpensesPage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	// State
	const [isCreating, setIsCreating] = useState(false);
	const [isCreatingType, setIsCreatingType] = useState(false);
	const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [newTypeName, setNewTypeName] = useState("");

	// Filter state
	const [query, setQuery] = useState("");
	const [filterTypeIds, setFilterTypeIds] = useState<string[]>([]);
	const [dateFrom, setDateFrom] = useState<string>("");
	const [dateTo, setDateTo] = useState<string>("");
	const [sortBy, setSortBy] = useState<
		"dateDesc" | "dateAsc" | "amountDesc" | "amountAsc" | "typeAsc" | "typeDesc"
	>("dateDesc");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	// Queries
	const expenseTypes = useQuery(trpc.expenseType.list.queryOptions());
	const expenses = useQuery(
		trpc.expense.list.queryOptions({
			query: query || undefined,
			expenseTypeIds: filterTypeIds.length > 0 ? filterTypeIds : undefined,
			dateFrom: dateFrom ? new Date(dateFrom).getTime() : undefined,
			dateTo: dateTo ? new Date(dateTo).getTime() + 86400000 : undefined,
			sortBy,
			page,
			pageSize,
		}),
	);

	const defaultDateFrom = useMemo(() => new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).getTime(), []);
	const defaultDateTo = useMemo(() => Date.now(), []);

	const dateFromTimestamp = useMemo(
		() => (dateFrom ? new Date(dateFrom).getTime() : defaultDateFrom),
		[dateFrom, defaultDateFrom],
	);
	const dateToTimestamp = useMemo(
		() => (dateTo ? new Date(dateTo).getTime() + 86400000 : defaultDateTo),
		[dateTo, defaultDateTo],
	);

	const expensesByMonth = useQuery(
		trpc.expense.getExpensesByMonth.queryOptions({
			dateFrom: dateFromTimestamp,
			dateTo: dateToTimestamp,
		}),
	);

	useEffect(() => {
		setPage(1);
	}, [query, filterTypeIds, dateFrom, dateTo, sortBy]);

	// Mutations
	const createTypeMutation = useMutation(
		trpc.expenseType.create.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({ queryKey: trpc.expenseType.list.queryKey() });
				setIsCreatingType(false);
				setNewTypeName("");
			},
		}),
	);

	const createMutation = useMutation(
		trpc.expense.create.mutationOptions({
			onSuccess: () => {
				refetchAll();
				setIsCreating(false);
			},
		}),
	);

	const updateMutation = useMutation(
		trpc.expense.update.mutationOptions({
			onSuccess: () => {
				refetchAll();
				setEditingExpense(null);
			},
		}),
	);

	const deleteMutation = useMutation(
		trpc.expense.delete.mutationOptions({
			onSuccess: () => {
				if ((expenses.data?.items.length ?? 0) <= 1 && page > 1) {
					setPage((prev) => Math.max(1, prev - 1));
				}
				refetchAll();
				setDeleteId(null);
			},
		}),
	);

	const refetchAll = () => {
		queryClient.invalidateQueries({ queryKey: trpc.expense.list.queryKey() });
		queryClient.invalidateQueries({ queryKey: trpc.expense.getExpensesByType.queryKey() });
		queryClient.invalidateQueries({ queryKey: trpc.expense.getExpensesByMonth.queryKey() });
	};

	const handleCreate = (values: {
		expenseTypeId: string;
		quantity: number;
		unitPrice: number;
		amount: number;
		notes: string | undefined;
		expenseDate: number;
	}) => {
		createMutation.mutate({
			expenseTypeId: values.expenseTypeId,
			quantity: values.quantity,
			unitPrice: values.unitPrice,
			amount: values.amount,
			notes: values.notes,
			expenseDate: values.expenseDate,
		});
	};

	const handleUpdate = (values: {
		expenseTypeId: string;
		quantity: number;
		unitPrice: number;
		amount: number;
		notes: string | undefined;
		expenseDate: number;
	}) => {
		if (!editingExpense) return;
		updateMutation.mutate({
			id: editingExpense.id,
			expenseTypeId: values.expenseTypeId,
			quantity: values.quantity,
			unitPrice: values.unitPrice,
			amount: values.amount,
			notes: values.notes,
			expenseDate: values.expenseDate,
		});
	};

	const handleCreateType = (e: React.FormEvent) => {
		e.preventDefault();
		if (newTypeName.trim()) {
			createTypeMutation.mutate({ name: newTypeName.trim() });
		}
	};

	const clearFilters = () => {
		setQuery("");
		setFilterTypeIds([]);
		setDateFrom("");
		setDateTo("");
		setSortBy("dateDesc");
	};

	const hasActiveFilters =
		query.trim().length > 0 ||
		filterTypeIds.length > 0 ||
		dateFrom !== "" ||
		dateTo !== "" ||
		sortBy !== "dateDesc";

	const totalExpenses = useMemo(() => {
		return expenses.data?.items.reduce((sum, e) => sum + e.amount, 0) ?? 0;
	}, [expenses.data]);

	const expenseItems: ExpenseItem[] = useMemo(() => {
		return (expenses.data?.items ?? []).map((item) => ({
			...item,
			expenseDate: new Date(item.expenseDate),
			createdAt: new Date(item.createdAt),
		}));
	}, [expenses.data]);

	return (
		<motion.div
			id="expenses-list-top"
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
							<Receipt className="text-primary h-6 w-6" />
						</div>
						<div>
							<h1 className="text-3xl font-semibold tracking-tight">{t("expenses.title")}</h1>
							<p className="text-muted-foreground mt-1">{t("expenses.description")}</p>
						</div>
					</div>
					{!isCreating && !editingExpense && (
						<Button onClick={() => setIsCreating(true)} className="gap-2">
							<Plus className="h-4 w-4" />
							{t("expenses.addNew")}
						</Button>
					)}
				</div>
			</motion.div>

			{/* Summary Cards */}
			<ExpenseSummaryCards
				totalExpenses={totalExpenses}
				totalCount={expenses.data?.total ?? 0}
				categoriesCount={expenseTypes.data?.length ?? 0}
			/>

			{/* Filters & List */}
			<motion.div variants={sectionFadeVariants}>
				<Card className="border-border/50 overflow-hidden">
					<CardContent className="p-6">
						{/* Filters */}
						<ExpenseFilters
							query={query}
							setQuery={setQuery}
							filterTypeIds={filterTypeIds}
							setFilterTypeIds={setFilterTypeIds}
							dateFrom={dateFrom}
							setDateFrom={setDateFrom}
							dateTo={dateTo}
							setDateTo={setDateTo}
							sortBy={sortBy}
							setSortBy={setSortBy}
							expenseTypes={expenseTypes.data ?? []}
							hasActiveFilters={hasActiveFilters}
							onClearFilters={clearFilters}
						/>

						{/* Create/Edit Form Sheet */}
						<ExpenseForm
							isOpen={isCreating || !!editingExpense}
							isEditing={!!editingExpense}
							expense={editingExpense ?? undefined}
							expenseTypes={expenseTypes.data ?? []}
							isPending={createMutation.isPending || updateMutation.isPending}
							onOpenChange={(open) => {
								if (!open) {
									setIsCreating(false);
									setEditingExpense(null);
								}
							}}
							onSubmit={editingExpense ? handleUpdate : handleCreate}
							onAddNewType={() => setIsCreatingType(true)}
						/>

						{/* Expenses List */}
						<ExpenseList
							expenses={expenseItems}
							isLoading={expenses.isLoading}
							page={expenses.data?.page ?? 1}
							totalPages={expenses.data?.totalPages ?? 1}
							deleteMutationPending={deleteMutation.isPending}
							onPageChange={setPage}
							onEdit={setEditingExpense}
							onDelete={setDeleteId}
						/>
					</CardContent>
				</Card>
			</motion.div>

			{/* Delete Dialog */}
			<ExpenseDeleteDialog
				deleteId={deleteId}
				isPending={deleteMutation.isPending}
				onOpenChange={(open) => !open && setDeleteId(null)}
				onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })}
			/>

			{/* Create Expense Type Dialog */}
			<ExpenseTypeDialog
				isOpen={isCreatingType}
				newTypeName={newTypeName}
				setNewTypeName={setNewTypeName}
				isPending={createTypeMutation.isPending}
				onOpenChange={setIsCreatingType}
				onSubmit={handleCreateType}
			/>
		</motion.div>
	);
}
