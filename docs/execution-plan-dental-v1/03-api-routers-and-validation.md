# Step 03 — API Routers and Validation

## Goal

Expose protected tRPC procedures with strict validation and domain invariants.

## Dependencies

- Step 01
- Step 02

## Checklist

- [x] Create/extend protected routers for Patients, VisitTypes, Visits.
- [x] Add Zod input/output schemas for all operations.
- [x] Enforce per-user isolation on all reads/writes.
- [x] Implement patient search procedure(s).
- [x] Implement visit type CRUD procedure(s).
- [x] Implement visit create/edit with nested acts.
- [x] Implement soft-delete and restore behavior for visits (if restore planned).
- [x] Enforce payment and act invariants at API boundary.
- [x] Add list/filter query procedures for visits:
    - [x] date range
    - [x] patient name
    - [x] visit type
- [x] Return stable, UI-friendly error shapes/messages.

## Done when

- [x] API can fully power UI without direct DB access from web app.
- [x] Invalid payloads and unauthorized access are rejected correctly.
