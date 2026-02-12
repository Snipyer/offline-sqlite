# Step 02 — DB Schema and Migrations

## Goal

Implement normalized tables and relations that encode the agreed contracts.

## Dependencies

- Step 01

## Checklist

- [x] Add/extend schema for `patients`.
- [x] Add/extend schema for `visit_types`.
- [x] Add/extend schema for `visits` (including ownership and soft-delete fields).
- [x] Add/extend schema for `visit_acts`.
- [x] Add relation/pivot model for act-to-teeth (or equivalent normalized design).
- [x] Ensure all required fields are `NOT NULL` where appropriate.
- [x] Add indexes for expected filters:
    - [x] visit date/time
    - [x] patient lookup/search keys
    - [x] visit type
    - [x] ownership keys
    - [x] soft-delete filtering
- [x] Generate and review migrations.
- [x] Verify migration applies cleanly on a fresh database.

## Done when

- [x] Schema supports all PRD entities and constraints.
- [x] Migrations run successfully and are reproducible.
