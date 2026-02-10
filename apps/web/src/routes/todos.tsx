import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";

export default function Todos() {
	const [newTodoText, setNewTodoText] = useState("");
	const { t } = useTranslation();

	const todos = useQuery(trpc.todo.getAll.queryOptions());
	const createMutation = useMutation(
		trpc.todo.create.mutationOptions({
			onSuccess: () => {
				todos.refetch();
				setNewTodoText("");
			},
		}),
	);
	const toggleMutation = useMutation(
		trpc.todo.toggle.mutationOptions({
			onSuccess: () => {
				todos.refetch();
			},
		}),
	);
	const deleteMutation = useMutation(
		trpc.todo.delete.mutationOptions({
			onSuccess: () => {
				todos.refetch();
			},
		}),
	);

	const handleAddTodo = (e: React.FormEvent) => {
		e.preventDefault();
		if (newTodoText.trim()) {
			createMutation.mutate({ text: newTodoText });
		}
	};

	const handleToggleTodo = (id: number, completed: boolean) => {
		toggleMutation.mutate({ id, completed: !completed });
	};

	const handleDeleteTodo = (id: number) => {
		deleteMutation.mutate({ id });
	};

	return (
		<div className="mx-auto w-full max-w-md py-10">
			<Card>
				<CardHeader>
					<CardTitle>{t("todos.title")}</CardTitle>
					<CardDescription>{t("todos.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleAddTodo} className="mb-6 flex items-center gap-2">
						<Input
							value={newTodoText}
							onChange={(e) => setNewTodoText(e.target.value)}
							placeholder={t("todos.placeholder")}
							disabled={createMutation.isPending}
						/>
						<Button type="submit" disabled={createMutation.isPending || !newTodoText.trim()}>
							{createMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								t("todos.add")
							)}
						</Button>
					</form>

					{todos.isLoading ? (
						<div className="flex justify-center py-4">
							<Loader2 className="h-6 w-6 animate-spin" />
						</div>
					) : todos.data?.length === 0 ? (
						<p className="py-4 text-center">{t("todos.empty")}</p>
					) : (
						<ul className="space-y-2">
							{todos.data?.map((todo) => (
								<li
									key={todo.id}
									className="flex items-center justify-between rounded-md border p-2"
								>
									<div className="flex items-center gap-2">
										<Checkbox
											checked={todo.completed}
											onCheckedChange={() => handleToggleTodo(todo.id, todo.completed)}
											id={`todo-${todo.id}`}
										/>
										<label
											htmlFor={`todo-${todo.id}`}
											className={`${todo.completed ? "line-through" : ""}`}
										>
											{todo.text}
										</label>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleDeleteTodo(todo.id)}
										aria-label={t("todos.deleteAria")}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
