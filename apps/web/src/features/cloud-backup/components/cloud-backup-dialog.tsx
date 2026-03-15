import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signInSocial } from "@daveyplate/better-auth-tauri";
import { Check, CloudUpload, Link2, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";

type Provider = "google" | "dropbox";

type CloudBackupDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

function providerLabelKey(provider: Provider) {
	return provider === "google" ? "cloudBackup.providers.google" : "cloudBackup.providers.dropbox";
}

export function CloudBackupDialog({ open, onOpenChange }: CloudBackupDialogProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const statusQuery = useQuery(
		trpc.cloudBackup.status.queryOptions(undefined, {
			staleTime: 30_000,
		}),
	);

	const backupMutation = useMutation(
		trpc.cloudBackup.backupNow.mutationOptions({
			onSuccess: (data) => {
				toast.success(
					t("cloudBackup.backupSuccess", {
						provider: t(providerLabelKey(data.provider)),
						fileName: data.fileName,
					}),
				);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	useEffect(() => {
		if (!open) {
			return;
		}

		queryClient.invalidateQueries({ queryKey: trpc.cloudBackup.status.queryKey() });
	}, [open, queryClient]);

	const signInWithProvider = async (provider: Provider, scopes?: string[]) => {
		try {
			const response = await signInSocial({
				authClient,
				provider,
				scopes,
			});

			const responseError = (response as { error?: { message?: string } })?.error;
			if (responseError?.message) {
				throw new Error(responseError.message);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t("cloudBackup.connectFailed"));
		}
	};

	const requestGoogleDriveAccess = async () => {
		await signInWithProvider("google", ["https://www.googleapis.com/auth/drive.file"]);
	};

	const isGoogleConnected = !!statusQuery.data?.googleConnected;
	const isDropboxConnected = !!statusQuery.data?.dropboxConnected;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md rounded-xl p-6" showCloseButton>
				<DialogHeader>
					<DialogTitle>{t("cloudBackup.dialogTitle")}</DialogTitle>
					<DialogDescription>{t("cloudBackup.dialogDescription")}</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<div
						className="border-border/70 bg-muted/30 flex items-center justify-between rounded-lg
							border p-3"
					>
						<div>
							<p className="text-sm font-medium">{t("cloudBackup.providers.google")}</p>
							<p className="text-muted-foreground text-xs">
								{isGoogleConnected
									? t("cloudBackup.connected")
									: t("cloudBackup.notConnected")}
							</p>
						</div>
						{isGoogleConnected ? (
							<Button
								type="button"
								variant="outline"
								onClick={() => backupMutation.mutate({ provider: "google" })}
								disabled={backupMutation.isPending}
							>
								{backupMutation.isPending ? (
									<Loader2 className="mr-1 h-4 w-4 animate-spin" />
								) : (
									<CloudUpload className="mr-1 h-4 w-4" />
								)}
								{t("cloudBackup.backupNow")}
							</Button>
						) : (
							<Button
								type="button"
								variant="outline"
								onClick={() => void signInWithProvider("google")}
							>
								<Link2 className="mr-1 h-4 w-4" />
								{t("cloudBackup.connect")}
							</Button>
						)}
					</div>

					{isGoogleConnected ? (
						<div className="mt-2">
							<Button
								type="button"
								variant="ghost"
								onClick={() => void requestGoogleDriveAccess()}
							>
								<Link2 className="mr-1 h-4 w-4" />
								{t("cloudBackup.connect")}
							</Button>
						</div>
					) : null}

					<div
						className="border-border/70 bg-muted/30 flex items-center justify-between rounded-lg
							border p-3"
					>
						<div>
							<p className="text-sm font-medium">{t("cloudBackup.providers.dropbox")}</p>
							<p className="text-muted-foreground text-xs">
								{isDropboxConnected
									? t("cloudBackup.connected")
									: t("cloudBackup.notConnected")}
							</p>
						</div>
						{isDropboxConnected ? (
							<Button
								type="button"
								variant="outline"
								onClick={() => backupMutation.mutate({ provider: "dropbox" })}
								disabled={backupMutation.isPending}
							>
								{backupMutation.isPending ? (
									<Loader2 className="mr-1 h-4 w-4 animate-spin" />
								) : (
									<CloudUpload className="mr-1 h-4 w-4" />
								)}
								{t("cloudBackup.backupNow")}
							</Button>
						) : (
							<Button
								type="button"
								variant="outline"
								onClick={() => void signInWithProvider("dropbox")}
							>
								<Link2 className="mr-1 h-4 w-4" />
								{t("cloudBackup.connect")}
							</Button>
						)}
					</div>
				</div>

				<DialogFooter className="mt-2 justify-between sm:justify-between">
					<div className="text-muted-foreground flex items-center gap-1 text-xs">
						<Check className="h-3.5 w-3.5" />
						<span>{t("cloudBackup.note")}</span>
					</div>
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
