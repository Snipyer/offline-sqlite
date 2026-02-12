# Step 09 — Tests, Polish, and Release Checklist

## Goal

Lock in correctness, UX quality, and readiness for iterative rollout.

## Dependencies

- Step 02
- Step 03
- Step 04
- Step 05
- Step 06
- Step 07
- Step 08

## Checklist

- [ ] Add API behavior tests for auth, validation, and filtering.
- [ ] Add unit tests for payment derivation and invariant rules.
- [ ] Add tests for visit-act rules (teeth required, non-negative price, at least one act).
- [ ] Add tests for patient search behavior.
- [ ] Run type checks for touched packages/apps.
- [ ] Verify i18n coverage for all added UI text.
- [ ] Verify loading/empty/error states across new views.
- [ ] Verify keyboard/focus usability on forms and filters.
- [ ] Verify soft-delete behavior in UI and API.
- [ ] Prepare rollout notes and known limitations list.

## Done when

- [ ] Critical paths pass manual validation and automated checks.
- [ ] Team has a clear go/no-go checklist for shipping.
