export * from "./auth";
export * from "./dental";
export * from "./expense";

export const appointmentStatusArray = ["scheduled", "completed", "cancelled", "no-show"] as const;
export type AppointmentStatus = (typeof appointmentStatusArray)[number];
