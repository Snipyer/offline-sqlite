import { router } from "../index";
import { patientRouter } from "./patient";
import { visitTypeRouter } from "./visit-type";
import { visitRouter } from "./visit";
import { paymentRouter } from "./payment";
import { dailySummaryRouter } from "./daily-summary";
import { reportsRouter } from "./reports";
import { appointmentRouter } from "./appointment";

export const appRouter = router({
	patient: patientRouter,
	visitType: visitTypeRouter,
	visit: visitRouter,
	payment: paymentRouter,
	dailySummary: dailySummaryRouter,
	reports: reportsRouter,
	appointment: appointmentRouter,
});
export type AppRouter = typeof appRouter;
