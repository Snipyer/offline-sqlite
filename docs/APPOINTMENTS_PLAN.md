# Appointments Feature Implementation Plan

## Overview

Add appointments feature to the dental clinic app. Each appointment belongs to a user, is linked to a patient, has a status, and includes a notes field.

## 1. Database Schema (`packages/db/src/schema/dental.ts`)

```typescript
appointment: sqliteTable(
	"appointment",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		patientId: text("patient_id")
			.notNull()
			.references(() => patient.id, { onDelete: "cascade" }),
		scheduledTime: integer("scheduled_time", { mode: "timestamp" }).notNull(),
		duration: integer("duration").notNull().default(30), // minutes
		status: text("status").notNull().default("scheduled"), // scheduled | completed | cancelled | no-show
		visitId: text("visit_id").references(() => visit.id, { onDelete: "set_null" }),
		visitTypeId: text("visit_type_id").references(() => visitType.id, { onDelete: "set_null" }),
		notes: text("notes"), // text field for notes
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	},
	(table) => ({
		userIdIdx: index("appointment_userId_idx").on(table.userId),
		patientIdIdx: index("appointment_patientId_idx").on(table.patientId),
		scheduledTimeIdx: index("appointment_scheduledTime_idx").on(table.scheduledTime),
	}),
);
```

**Relations**: Add `appointments` to `patient`, `user`, `visit`, `visitType` tables.

## 2. Export Schema (`packages/db/src/schema/index.ts`)

- Export `appointment` table and type
- Export `appointmentStatusEnum` as const array: `["scheduled", "completed", "cancelled", "no-show"]`

## 3. API Router (`packages/api/src/routers/appointment.ts`)

### Procedures

| Procedure | Input                                                              | Description                                                     |
| --------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| `list`    | `{ month: number, year: number }`                                  | Get all appointments for a month (grouped by date for calendar) |
| `getById` | `{ id: string }`                                                   | Single appointment                                              |
| `create`  | `{ patientId, scheduledTime, duration?, visitTypeId?, notes? }`    | Create new                                                      |
| `update`  | `{ id, scheduledTime?, duration?, status?, visitTypeId?, notes? }` | Update                                                          |
| `delete`  | `{ id: string }`                                                   | Delete                                                          |

### Zod Schemas

```typescript
const createSchema = z.object({
	patientId: z.string().min(1),
	scheduledTime: z.string(), // ISO string
	duration: z.number().int().min(15).max(240).default(30),
	visitTypeId: z.string().optional(),
	notes: z.string().optional(),
});

const updateSchema = createSchema.partial().extend({ id: z.string() });
```

## 4. Register Router (`packages/api/src/routers/index.ts`)

Add `appointment: appointmentRouter` to main router.

## 5. Visit → Appointment Auto-Complete (`packages/api/src/routers/visit.ts`)

In the `create` mutation, after inserting the visit:

```typescript
// Find the most recent scheduled appointment for this patient
const scheduledAppointment = await ctx.db.query.appointment.findFirst({
	where: and(
		eq(appointment.patientId, input.patientId),
		eq(appointment.status, "scheduled"),
		// Find appointment within a reasonable time window (e.g., 2 hours before/after visit)
	),
	orderBy: desc(appointment.scheduledTime),
});

if (scheduledAppointment) {
	await ctx.db
		.update(appointment)
		.set({
			status: "completed",
			visitId: newVisit.id,
			updatedAt: new Date(),
		})
		.where(eq(appointment.id, scheduledAppointment.id));
}
```

## 6. UI Components

### Page Layout (`appointments._index.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Appointments" + "New Appointment" button      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │                     │  │   Time Slots (08:00-20:00)│ │
│  │     Calendar        │  │   15-min intervals       │ │
│  │   (current month)   │  │                         │ │
│  │                     │  │   08:00 [btn]            │ │
│  │   Days with         │  │   08:15 [btn]            │ │
│  │   appointments      │  │   08:30 [btn]            │ │
│  │   have indicator    │  │   ...                    │ │
│  │                     │  │   19:45 [btn]            │ │
│  └─────────────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Selected Date: Jan 15, 2025                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Appointment Card 1                                   ││
│  │ 10:00 - 10:30 • Patient A • Cleaning              ││
│  │ Notes: Patient requested morning slot               ││
│  │ [Edit] [Delete]                                      ││
│  ├─────────────────────────────────────────────────────┤│
│  │ Appointment Card 2                                   ││
│  │ 14:30 - 15:00 • Patient B • Checkup               ││
│  │ [Edit] [Delete]                                     ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Calendar Behavior

- Shows current month by default
- Days with appointments have a visual indicator (dot or highlight)
- Clicking a date shows appointments for that date below

### Time Slots Panel

- Right side of calendar
- 08:00 to 20:00 (48 slots)
- 15-minute intervals
- Clicking a time shows "Create Appointment" button that triggers the form

### Appointment Form Fields

| Field          | Type                                    | Required |
| -------------- | --------------------------------------- | -------- |
| Patient        | Searchable dropdown                     | Yes      |
| Scheduled Time | DateTime (pre-filled if from time slot) | Yes      |
| Duration       | Number (15-240 min, default: 30)        | Yes      |
| Visit Type     | Dropdown                                | No       |
| Notes          | Textarea                                | No       |

### Appointment Card

- Time range (scheduledTime + duration)
- Patient name
- Visit type
- Notes (if present)
- Status badge (scheduled/completed/cancelled/no-show)
- Edit/Delete actions

## 7. Translations

```json
{
	"appointments": {
		"title": "Appointments",
		"new": "New Appointment",
		"edit": "Edit Appointment",
		"scheduledTime": "Scheduled Time",
		"duration": "Duration (minutes)",
		"status": "Status",
		"patient": "Patient",
		"visitType": "Visit Type",
		"notes": "Notes",
		"noAppointments": "No appointments for this date",
		"selectDate": "Select a date to view appointments",
		"createAppointment": "Create Appointment",
		"statuses": {
			"scheduled": "Scheduled",
			"completed": "Completed",
			"cancelled": "Cancelled",
			"noShow": "No Show"
		}
	}
}
```

## 8. Navigation

Add "Appointments" link in sidebar navigation.

## Implementation Order

1. `packages/db/src/schema/dental.ts` - Add appointment table
2. `packages/db/src/schema/index.ts` - Export table and types
3. `packages/api/src/routers/appointment.ts` - Create router
4. `packages/api/src/routers/index.ts` - Register router
5. `packages/api/src/routers/visit.ts` - Add auto-complete logic
6. `apps/web/src/features/appointments/components/` - Create UI components
7. `apps/web/src/routes/appointments.tsx` - Create route
8. `packages/i18n/languages/en.json` - Add translations
9. Navigation component - Add link

## Post-Implementation Commands

```bash
bun run db:generate
bun run db:push
bun run check-types
```
