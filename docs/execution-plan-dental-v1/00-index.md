# Dental Visits V1 — Execution Plan Index

Source PRD: ../prd-dental-visits-v1.md

## How to use this plan

- Execute steps in order.
- Do not start a step until all listed dependencies are complete.
- Update checkboxes in each step file as work progresses.
- Keep changes small and scoped to the active step only.

## Ordered Steps (dependency-first)

1. [01-contracts-and-rules.md](01-contracts-and-rules.md) — no dependencies
2. [02-db-schema-and-migrations.md](02-db-schema-and-migrations.md) — depends on 01
3. [03-api-routers-and-validation.md](03-api-routers-and-validation.md) — depends on 01, 02
4. [04-feature-visit-types.md](04-feature-visit-types.md) — depends on 03
5. [05-feature-patients.md](05-feature-patients.md) — depends on 03
6. [06-shared-tooth-selection-module.md](06-shared-tooth-selection-module.md) — depends on 01
7. [07-feature-visits-create-edit-with-acts.md](07-feature-visits-create-edit-with-acts.md) — depends on 03, 04, 05, 06
8. [08-feature-visits-list-filters-soft-delete.md](08-feature-visits-list-filters-soft-delete.md) — depends on 03, 04, 05, 07
9. [09-tests-polish-and-release-checklist.md](09-tests-polish-and-release-checklist.md) — depends on 02, 03, 04, 05, 06, 07, 08

## Dependency notes

- Visit Types and Patients can be built in parallel after API foundations are ready.
- Tooth selection module is intentionally early and independent so it can be reused by visits forms.
- Visits create/edit waits for all referenced entities and selector module to avoid rework.
