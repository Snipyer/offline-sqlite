import { protectedProcedure, publicProcedure, router } from "../index";
import { patientRouter } from "./patient";
import { visitTypeRouter } from "./visit-type";
import { visitRouter } from "./visit";
import { paymentRouter } from "./payment";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	patient: patientRouter,
	visitType: visitTypeRouter,
	visit: visitRouter,
	payment: paymentRouter,
});
export type AppRouter = typeof appRouter;
