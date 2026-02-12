# Step 01 — Contracts and Rules

## Goal

Define canonical domain contracts and business rules before implementation.

## Dependencies

- None

## Checklist

- [x] Finalize entities and required fields: Patient, VisitType, Visit, VisitAct.
- [x] Finalize enum/value domains (sex, status, tooth ID format FDI).
- [x] Finalize required vs optional fields from PRD.
- [x] Finalize money invariants:
    - [x] `visitTotal = sum(visitAct.price)`
    - [x] `visitTotal >= 0`
    - [x] `amountPaid >= 0`
    - [x] `amountPaid <= visitTotal`
    - [x] `amountLeft = visitTotal - amountPaid`
- [x] Finalize visit-act invariants:
    - [x] at least one act per visit
    - [x] each act has one or more teeth
    - [x] each act price is non-negative
- [x] Finalize soft-delete behavior and visibility rules.
- [x] Finalize per-user isolation rules for all domains.

## Done when

- [x] Team can implement DB/API/UI without ambiguity.
- [x] No unresolved decisions remain for required fields or formulas.
