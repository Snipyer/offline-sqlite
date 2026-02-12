# Step 08 — Feature: Visits List, Filters, Soft Delete

## Goal

Deliver operational visits list with mandatory filtering and safe record lifecycle.

## Dependencies

- Step 03
- Step 04
- Step 05
- Step 07

## Checklist

- [x] Build visits list page using tRPC query procedures.
- [x] Add required filters:
    - [x] date range
    - [x] patient name
    - [x] visit type
- [x] Display derived financial values consistently.
- [x] Add action(s) to edit visit.
- [x] Add soft-delete action with confirmation.
- [x] Ensure soft-deleted records are excluded/included per agreed behavior.
- [x] Preserve filter state during user navigation where practical.
- [x] Add loading/empty/error states.
- [x] Add i18n keys for all user-facing strings.

## Done when

- [x] Dentist can find and maintain visit records quickly.
- [x] Soft-delete lifecycle works without data loss.
