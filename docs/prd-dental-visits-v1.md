## Problem Statement

As a dentist, I need a fast and reliable way to record and manage patient visits, including clinical and payment details, without juggling scattered notes or manually tracking balances. The current app pattern is a simple todo flow and does not support patient entities, visit history, structured tooth selection, or clinical filtering workflows.

The key pain points are:

- No dedicated patient entity with searchable identity and history
- No visit workflow with dental-specific fields (visit type, teeth worked on, payment tracking)
- No domain filters to quickly find visits by date, patient, and visit type
- No safe lifecycle model for records (edit + soft delete)
- Need for a 3D mouth interaction to select treated teeth in a structured way

## Solution

Build a protected, visits-first dental record system that introduces:

- Dedicated patients as first-class entities
- Visit types as a dentist-managed entity
- Visits linked to patients and visit types
- Multiple acts per visit, where each act includes one or more teeth and a price
- Structured tooth selection using a newly built 3D mouth (stored as FDI tooth IDs)
- Strict payment rules (`visit total = sum of act prices`, `left = total - paid`, non-negative, `paid <= total`)
- Visit list with mandatory filters (date range, patient name, visit type)
- Edit + soft delete lifecycle for visits
- Per-user data isolation for authenticated users

The experience should remain simple for daily use while being extensible for future modules.

## User Stories

1. As a dentist, I want to create patient records, so that visits are linked to a real person rather than duplicated free text.
2. As a dentist, I want patient name, sex, and age to be required, so that minimum clinical identity data is always complete.
3. As a dentist, I want patient phone to be optional, so that I can save records even when contact details are unavailable.
4. As a dentist, I want patient address to be optional, so that extra demographic detail can be captured when needed.
5. As a dentist, I want to search patients by their information, so that I can quickly find the right record before creating a visit.
6. As a dentist, I want to create and manage visit types, so that my clinic can use custom categories aligned with real workflows.
7. As a dentist, I want to create a visit by selecting a patient and visit type, so that every visit is consistently categorized.
8. As a dentist, I want to add multiple acts to a visit, so that I can record all performed treatments in one visit record.
9. As a dentist, I want each act to include one or more teeth and a price, so that clinical and financial details are tied together.
10. As a dentist, I want the visit total amount to be calculated as the sum of all act prices, so that totals are always consistent.
11. As a dentist, I want to set amount paid on each visit, so that payment status is tracked at the source.
12. As a dentist, I want the remaining amount to be calculated and validated automatically, so that accounting errors are prevented.
13. As a dentist, I want note fields to be optional on visits, so that I can add clinical details only when necessary.
14. As a dentist, I want each visit to include visit time, so that chronological history is reliable.
15. As a dentist, I want to use a 3D mouth to select operated teeth, so that charting is accurate and intuitive.
16. As a dentist, I want selected teeth to be required on visits, so that procedures always include dental context.
17. As a dentist, I want selected teeth stored as structured FDI IDs, so that future reporting and clinical logic remain possible.
18. As a dentist, I want to view all visits in a dedicated list, so that I can review ongoing and historical work.
19. As a dentist, I want to filter visits by date range, so that I can inspect specific periods.
20. As a dentist, I want to filter visits by patient name, so that I can focus on one patient’s activity.
21. As a dentist, I want to filter visits by visit type, so that I can inspect specific clinical categories.
22. As a dentist, I want to edit visit records, so that corrections can be made when details change.
23. As a dentist, I want soft delete for visits, so that mistaken records can be hidden without losing auditability.
24. As a dentist, I want all dental data endpoints protected, so that records are not accessible without authentication.
25. As a dentist, I want records isolated per authenticated user, so that each dentist sees only their own data.
26. As a dentist, I want the initial version to stay simple and focused, so that the team can ship quickly and iterate.
27. As a future product owner, I want extensible domain boundaries (patients, visit types, visits, acts, teeth), so that advanced modules can be added later.

## 'Polishing' Requirements

- Ensure all user-facing text uses i18n keys and has consistent terminology across patient, visit, and payment flows.
- Ensure loading, empty, and error states exist for list pages, forms, and filter actions.
- Ensure validation messages are clear, actionable, and non-technical.
- Ensure keyboard/focus behavior is usable in create/edit forms and filter controls.
- Ensure soft-deleted records are visually and behaviorally consistent with product expectations.
- Ensure the 3D tooth selection interaction gives clear selected/unselected feedback.
- Ensure mutation success/failure feedback is consistent and unobtrusive.
- Ensure form defaults and field ordering optimize fast data entry.

## Implementation Decisions

- **Domain split**: introduce five core domains: Patients, Visit Types, Visits, Visit Acts, and Tooth Selection.
- **Product strategy**: visits-first MVP while still implementing dedicated patient entities.
- **Data ownership**: all records scoped to authenticated user identity (per-user isolation).
- **Patient model**: patient is a first-class entity; no phone uniqueness enforced in v1.
- **Visit type model**: visit types are user-managed entities and selectable during visit creation/edit.
- **Visit model**: each visit links to one patient and one visit type and contains one or more acts.
- **Visit act model**: each act stores one or more required FDI tooth IDs and a non-negative price.
- **Total calculation**: visit total is derived from data (`sum(act.price)`) and not manually entered.
- **Payment constraints**: enforce strict accounting invariants (`total = sum(act.price)`, `total >= 0`, `paid >= 0`, `paid <= total`, `left = total - paid`).
- **Teeth storage**: persist selected teeth as required FDI tooth IDs.
- **3D interface decision**: build a new 3D mouth component in v1 rather than a temporary checklist.
- **Query/filter contract**: visit list supports mandatory filters (date range, patient name, visit type).
- **Record lifecycle**: support create, edit, and soft delete for visits.
- **API security**: all dental APIs use authenticated procedures only.
- **Extensibility direction**: keep module boundaries stable so future features can extend without major rewrites.

## Testing Decisions

- Good tests validate externally observable behavior (inputs, outputs, permissions, filtering results, validation outcomes), not implementation internals.
- Primary test targets in this phase:
    - API procedures: auth enforcement, input validation, query filtering behavior, and mutation outcomes
    - Visit act rules: at least one act, each act has valid teeth and non-negative price
    - Payment rules: invariant enforcement, total derivation from acts, and derived balance correctness
    - Patient search: expected query behavior for supported patient fields
- Test levels:
    - Procedure-level integration tests for end-to-end request/response behavior
    - Focused unit tests for reusable validation/calculation logic
- Prior art:
    - Existing repository patterns show feature-aligned router and schema layering, but there are currently no established automated test files; this feature defines the initial testing baseline for these domains.

## Out of Scope

- Appointment calendar and scheduling workflows
- Analytics/reporting dashboards
- Invoice/PDF generation
- Image/X-ray upload and storage
- Advanced multi-clinic role/permission matrix beyond per-user isolation
- Hard delete workflows for visit records

## Further Notes

- This PRD intentionally biases for operational simplicity and daily speed of use.
- The chosen data model supports later extensions (billing documents, richer reporting, procedure templates) without reworking core entities.
- Because visit types are user-defined, migration and seed assumptions should be minimal.
- The first implementation should prioritize correctness of records and filters before adding advanced UX enhancements.
