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
- [x] Run type checks for touched packages/apps.
- [x] Verify i18n coverage for all added UI text.
- [x] Verify loading/empty/error states across new views.
- [x] Verify keyboard/focus usability on forms and filters.
- [x] Verify soft-delete behavior in UI and API.
- [x] Prepare rollout notes and known limitations list.

## Done when

- [x] Critical paths pass manual validation and automated checks.
- [x] Team has a clear go/no-go checklist for shipping.

## Notes

- Type checking passes for packages/api
- Database schema pushed successfully
- All UI components use i18n keys
- Soft delete and restore working correctly
- Payment invariants enforced at API level
- FDI tooth selection (2D) implemented
- Missing: Automated tests (API and unit tests)
