# Step 02 — DB Schema and Migrations

## Goal

Implement normalized tables and relations that encode the agreed contracts.

## Dependencies

- Step 01

## Checklist

- [ ] Add/extend schema for `patients`.
- [ ] Add/extend schema for `visit_types`.
- [ ] Add/extend schema for `visits` (including ownership and soft-delete fields).
- [ ] Add/extend schema for `visit_acts`.
- [ ] Add relation/pivot model for act-to-teeth (or equivalent normalized design).
- [ ] Ensure all required fields are `NOT NULL` where appropriate.
- [ ] Add indexes for expected filters:
    - [ ] visit date/time
    - [ ] patient lookup/search keys
    - [ ] visit type
    - [ ] ownership keys
    - [ ] soft-delete filtering
- [ ] Generate and review migrations.
- [ ] Verify migration applies cleanly on a fresh database.

## Done when

- [ ] Schema supports all PRD entities and constraints.
- [ ] Migrations run successfully and are reproducible.
