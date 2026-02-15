import { db } from "@offline-sqlite/db";
import { payment } from "@offline-sqlite/db/schema/dental";
import { eq } from "drizzle-orm";

export async function getVisitTotalPaid(visitId: string): Promise<number> {
	const payments = await db
		.select({ amount: payment.amount })
		.from(payment)
		.where(eq(payment.visitId, visitId));
	return payments.reduce((sum, p) => sum + p.amount, 0);
}
