import { TypeListItem } from "./type-list-item";
import { TypeEmptyState } from "./type-empty-state";
import { PaginationControls } from "@/components/pagination-controls";

interface TypeListItemsProps {
	type: "visit" | "expense";
	items: Array<{ id: string; name: string }>;
	page: number;
	totalPages: number;
	editingId: string | null;
	editFormName: string;
	isEditPending: boolean;
	isDeletePending: boolean;
	onPageChange: (page: number) => void;
	onStartEdit: (id: string, name: string) => void;
	onEditFormNameChange: (name: string) => void;
	onEditSubmit: (e: React.FormEvent) => void;
	onEditCancel: () => void;
	onDelete: (id: string) => void;
}

export function TypeListItems({
	type,
	items,
	page,
	totalPages,
	editingId,
	editFormName,
	isEditPending,
	isDeletePending,
	onPageChange,
	onStartEdit,
	onEditFormNameChange,
	onEditSubmit,
	onEditCancel,
	onDelete,
}: TypeListItemsProps) {
	if (items.length === 0) {
		return <TypeEmptyState type={type} />;
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				{items.map((item, index) => (
					<TypeListItem
						key={item.id}
						item={item}
						index={index}
						type={type}
						isEditing={editingId === item.id}
						editFormName={editingId === item.id ? editFormName : ""}
						isEditPending={isEditPending}
						isDeletePending={isDeletePending}
						onStartEdit={onStartEdit}
						onEditFormNameChange={onEditFormNameChange}
						onEditSubmit={onEditSubmit}
						onEditCancel={onEditCancel}
						onDelete={onDelete}
					/>
				))}
			</div>
			<PaginationControls
				page={page}
				totalPages={totalPages}
				onPageChange={onPageChange}
				scrollTarget="types-list-top"
			/>
		</div>
	);
}
