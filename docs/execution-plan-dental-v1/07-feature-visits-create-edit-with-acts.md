# Step 07 — Feature: Visits Create/Edit with Acts

## Goal

Deliver create/edit visit workflow including multiple acts, tooth linking, and derived totals.

## Dependencies

- Step 03
- Step 04
- Step 05
- Step 06

## Checklist

- [ ] Create feature folder for visits create/edit flows.
- [ ] Build visit form with patient + visit type selection.
- [ ] Build dynamic acts editor:
    - [ ] add/remove act rows
    - [ ] each act must include one or more teeth
    - [ ] each act has non-negative price
- [ ] Integrate shared 3D selector per act.
- [ ] Derive visit total from act prices only (no manual total entry).
- [ ] Capture amount paid and derive amount left.
- [ ] Prevent submit when invariants fail.
- [ ] Support editing existing visits with acts preserved.
- [ ] Wire create/update mutations and optimistic/refresh strategy.
- [ ] Add loading/error UX and mutation feedback.
- [ ] Add i18n keys for all user-facing strings.

## Done when

- [ ] Dentist can create and edit visits with multiple acts end to end.
- [ ] Financial values are always internally consistent.
