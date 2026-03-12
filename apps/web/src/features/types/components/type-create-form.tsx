import { Loader2, Check, X, Info } from "lucide-react";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@offline-sqlite/i18n";

interface TypeCreateFormProps {
	type: "visit" | "expense";
	isCreating: boolean;
	formName: string;
	isPending: boolean;
	onFormNameChange: (name: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	onCancel: () => void;
}

export function TypeCreateForm({
	type,
	isCreating,
	formName,
	isPending,
	onFormNameChange,
	onSubmit,
	onCancel,
}: TypeCreateFormProps) {
	const { t } = useTranslation();

	if (!isCreating) return null;

	return (
		<motion.form
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: "auto" }}
			exit={{ opacity: 0, height: 0 }}
			onSubmit={onSubmit}
			className="border-border/50 bg-muted/30 mb-6 rounded-xl border p-4"
		>
			<div className="mb-4">
				<Label
					htmlFor="new-name"
					className="text-muted-foreground text-xs font-medium tracking-wider uppercase"
				>
					{t(`${type}Types.nameLabel`)}
				</Label>
				{type === "visit" && (
					<p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
						<Info className="h-3.5 w-3.5" />
						<span>{t("visitTypes.multiCreateNotice")}</span>
					</p>
				)}
				<Input
					id="new-name"
					autoFocus
					value={formName}
					onChange={(e) => onFormNameChange(e.target.value)}
					placeholder={t(`${type}Types.namePlaceholder`)}
					className="mt-1.5"
				/>
			</div>
			<div className="flex gap-2">
				<Button type="submit" disabled={isPending || !formName.trim()} className="gap-2">
					{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
					{t("common.save")}
				</Button>
				<Button type="button" variant="outline" onClick={onCancel}>
					<X className="mr-2 h-4 w-4" />
					{t("common.cancel")}
				</Button>
			</div>
		</motion.form>
	);
}
