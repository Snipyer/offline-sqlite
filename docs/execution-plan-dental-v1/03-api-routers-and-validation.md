# Step 03 — API Routers and Validation

## Goal

Expose protected tRPC procedures with strict validation and domain invariants.

## Dependencies

- Step 01
- Step 02

## Checklist

- [ ] Create/extend protected routers for Patients, VisitTypes, Visits.
- [ ] Add Zod input/output schemas for all operations.
- [ ] Enforce per-user isolation on all reads/writes.
- [ ] Implement patient search procedure(s).
- [ ] Implement visit type CRUD procedure(s).
- [ ] Implement visit create/edit with nested acts.
- [ ] Implement soft-delete and restore behavior for visits (if restore planned).
- [ ] Enforce payment and act invariants at API boundary.
- [ ] Add list/filter query procedures for visits:
    - [ ] date range
    - [ ] patient name
    - [ ] visit type
- [ ] Return stable, UI-friendly error shapes/messages.

## Done when

- [ ] API can fully power UI without direct DB access from web app.
- [ ] Invalid payloads and unauthorized access are rejected correctly.
