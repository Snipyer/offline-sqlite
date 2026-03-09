import { useState } from "react";
import { useTranslation } from "@offline-sqlite/i18n";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Send, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface ContactInfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	href: string;
	qrValue?: string;
	qrTitle: string;
}

function ContactInfoRow({ icon, label, value, href, qrValue, qrTitle }: ContactInfoRowProps) {
	const { t } = useTranslation();
	const [showQrDialog, setShowQrDialog] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(value);
		toast.success(`${label} copied to clipboard`);
	};

	return (
		<>
			<div className="flex items-center gap-2">
				<div className="text-muted-foreground">{icon}</div>
				<a
					href={href}
					className="text-primary text-sm underline"
					target="_blank"
					rel="noopener noreferrer"
				>
					{value}
				</a>
				<div className="ms-auto flex gap-1">
					<Button variant="ghost" size="icon-xs" onClick={handleCopy} aria-label={`Copy ${label}`}>
						<Copy className="size-3" />
					</Button>
					{qrValue && (
						<Button
							variant="ghost"
							size="icon-xs"
							onClick={() => setShowQrDialog(true)}
							aria-label={`Show QR code for ${label}`}
						>
							<QrCode className="size-3" />
						</Button>
					)}
				</div>
			</div>

			{qrValue && (
				<AlertDialog open={showQrDialog} onOpenChange={setShowQrDialog}>
					<AlertDialogContent className="max-w-sm rounded-2xl border p-0 shadow-2xl">
						<div
							className="to-background rounded-t-2xl bg-linear-to-br from-zinc-100 via-zinc-50
								px-6 py-6 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-950"
						>
							<AlertDialogHeader className="gap-2">
								<AlertDialogTitle className="text-base font-semibold tracking-tight">
									{qrTitle}
								</AlertDialogTitle>
								<AlertDialogDescription className="text-muted-foreground text-xs">
									{t("licensing.qrDialogDescription")}
								</AlertDialogDescription>
							</AlertDialogHeader>
						</div>

						<div className="flex flex-col items-center gap-4 px-6 py-6">
							<div className="bg-background rounded-xl border p-3 shadow-xs">
								<QRCodeSVG value={qrValue} size={180} marginSize={2} />
							</div>
						</div>

						<AlertDialogFooter className="border-t px-6 py-4">
							<AlertDialogCancel className="w-full sm:w-auto">
								{t("common.cancel")}
							</AlertDialogCancel>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</>
	);
}

export default function ContactInfo() {
	const { t } = useTranslation();
	const mail = "mryasserdaas@gmail.com";
	const phone = "+213697092296";
	const telegram = "t.me/YasserDaas";

	return (
		<div className="mt-8 space-y-3">
			<div className="bg-card flex flex-col gap-2 rounded-lg border p-4">
				<p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
					{t("licensing.contactForLicense")}
				</p>

				<ContactInfoRow
					icon={<Mail className="size-4" />}
					label="Email"
					value={mail}
					href={`mailto:${mail}`}
					qrValue={`mailto:${mail}`}
					qrTitle={t("licensing.qrDialogEmailTitle", { email: mail })}
				/>

				<ContactInfoRow
					icon={<Phone className="size-4" />}
					label="Phone"
					value={phone}
					href={`tel:${phone}`}
					qrValue={`tel:${phone}`}
					qrTitle={t("licensing.qrDialogPhoneTitle", { phone })}
				/>

				<ContactInfoRow
					icon={<Send className="size-4" />}
					label="Telegram"
					value={telegram}
					href={`//${telegram}`}
					qrValue={`${telegram}`}
					qrTitle={t("licensing.qrDialogTelegramTitle", { telegram })}
				/>
			</div>
		</div>
	);
}
