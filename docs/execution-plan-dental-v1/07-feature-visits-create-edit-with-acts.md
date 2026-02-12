# Step 07 — Feature: Visits Create/Edit with Acts

## Goal

Deliver create/edit visit workflow including multiple acts, tooth linking, and derived totals.

## Dependencies

- Step 03
- Step 04
- Step 05
- Step 06

## Checklist

- [x] Create feature folder for visits create/edit flows.
- [x] Build visit form with patient + visit type selection.
- [x] Build dynamic acts editor:
    - [x] add/remove act rows
    - [x] each act must include one or more teeth
    - [x] each act has non-negative price
- [x] Integrate shared tooth selector per act.
- [x] Derive visit total from act prices only (no manual total entry).
- [x] Capture amount paid and derive amount left.
- [x] Prevent submit when invariants fail.
- [x] Support editing existing visits with acts preserved.
- [x] Wire create/update mutations and optimistic/refresh strategy.
- [x] Add loading/error UX and mutation feedback.
- [x] Add i18n keys for all user-facing strings.

## Done when

- [x] Dentist can create and edit visits with multiple acts end to end.
- [x] Financial values are always internally consistent.
