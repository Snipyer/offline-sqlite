# Step 08 — Feature: Visits List, Filters, Soft Delete

## Goal

Deliver operational visits list with mandatory filtering and safe record lifecycle.

## Dependencies

- Step 03
- Step 04
- Step 05
- Step 07

## Checklist

- [ ] Build visits list page using tRPC query procedures.
- [ ] Add required filters:
    - [ ] date range
    - [ ] patient name
    - [ ] visit type
- [ ] Display derived financial values consistently.
- [ ] Add action(s) to edit visit.
- [ ] Add soft-delete action with confirmation.
- [ ] Ensure soft-deleted records are excluded/included per agreed behavior.
- [ ] Preserve filter state during user navigation where practical.
- [ ] Add loading/empty/error states.
- [ ] Add i18n keys for all user-facing strings.

## Done when

- [ ] Dentist can find and maintain visit records quickly.
- [ ] Soft-delete lifecycle works without data loss.
