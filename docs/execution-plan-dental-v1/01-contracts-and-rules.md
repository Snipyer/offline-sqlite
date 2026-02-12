# Step 01 — Contracts and Rules

## Goal

Define canonical domain contracts and business rules before implementation.

## Dependencies

- None

## Checklist

- [ ] Finalize entities and required fields: Patient, VisitType, Visit, VisitAct.
- [ ] Finalize enum/value domains (sex, status, tooth ID format FDI).
- [ ] Finalize required vs optional fields from PRD.
- [ ] Finalize money invariants:
    - [ ] `visitTotal = sum(visitAct.price)`
    - [ ] `visitTotal >= 0`
    - [ ] `amountPaid >= 0`
    - [ ] `amountPaid <= visitTotal`
    - [ ] `amountLeft = visitTotal - amountPaid`
- [ ] Finalize visit-act invariants:
    - [ ] at least one act per visit
    - [ ] each act has one or more teeth
    - [ ] each act price is non-negative
- [ ] Finalize soft-delete behavior and visibility rules.
- [ ] Finalize per-user isolation rules for all domains.

## Done when

- [ ] Team can implement DB/API/UI without ambiguity.
- [ ] No unresolved decisions remain for required fields or formulas.
