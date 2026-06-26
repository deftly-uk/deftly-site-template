# Rebuild content reconciliation (execution plan)

- **Date:** 2026-06-26
- **Branch:** new branch off `main` (e.g. `rebuild-reconciliation`)
- **Decision being implemented:** [ADR 0001](../decisions/0001-rebuild-content-reconciliation.md),
  Option 2 (tag engine-generated content). Backlog item: Phase 4.
- **Governing law:** `CONSTITUTION.md` Articles I and II. The customer owns and can edit
  everything; a rebuild must never destroy the customer's own work.

## The problem (one line)

When a site is rebuilt from its spec, the rebuild must update and clean up only the
content **the engine generated**, and never touch content the **customer** added or edited.

## Decision recap

- Tag every engine-generated `services` / `testimonials` row with its origin.
- On rebuild: upsert the spec's items, delete `spec`-origin rows that are gone from the
  spec, leave `owner`-origin rows alone.
- When a customer edits a `spec` row in the admin, promote it to `owner` so the engine
  stops managing it.

## The cross-system dependency (decide first)

The CRM spec (`serviceSchema` / `testimonialSchema`) has **no stable id per item** today;
items are identified only by their text. Consequences:

- **Removals** can be handled now (an item absent from the new spec is removed).
- **Renames** cannot be told apart from "delete old + add new" without a stable id.

**Plan: ship the "lite" version now, raise the CRM id ask in parallel.**

- **Now (this repo, no CRM change):** add origin tagging + edit-promotion + removal
  reconcile. Match spec items by a derived key (slug of title / author+quote). A rename
  may briefly create a duplicate until the CRM sends ids; that is a tidy-up, not data loss.
- **Later (when the CRM adds ids):** switch the match key from the derived slug to the
  spec id. Renames then update in place. This is a one-line change to the key function
  plus a mirror of the schema change. Tracked as a follow-up.

## Steps

1. **Schema (this repo).** Add to `Services` and `Testimonials` collections:
   - `origin`: `select` of `spec` | `owner`, default `owner`, hidden in admin
     (`admin.hidden`), `read`-only. Default `owner` is the safe default: anything created
     by hand is the customer's.
   - `specKey`: `text`, hidden, the stable match key. (When CRM ids land, this stores the
     id; until then, the derived slug.)
2. **Stable key helper.** `specKeyFor(service)` / `specKeyFor(testimonial)`: slug of the
   title (services) or `authorName + quote` hash (testimonials). One small pure function,
   unit-tested. Swappable for the CRM id later.
3. **Provisioning (`src/lib/provision.ts`).**
   - `upsertTenantDoc`: match by `{ tenant, specKey }` instead of the mutable title, and
     write `origin: 'spec'` + `specKey` on create/update. Never downgrade an `owner` row
     back to `spec` (if a row is already `owner`, skip it).
   - `provisionTenantContent`: after upserting the spec items for a tenant, **reconcile**:
     delete `services` / `testimonials` where `tenant = X AND origin = 'spec' AND specKey
     NOT IN (<spec keys>)`. `owner` rows are untouched by construction.
4. **Edit-promotion hook.** A `beforeChange` hook on `Services` / `Testimonials`: if there
   is an authenticated `req.user` (a real admin edit, not a system write) and the existing
   row is `origin: 'spec'`, set `origin: 'owner'`. System writes (`overrideAccess`, no
   user) keep `spec`. This is what makes a customer's edit "stick".
5. **Migration + types.** `npm run generate:types`, then `npm run migrate:create
   rebuild_origin_tagging`. Default existing rows: leave as `owner` (treat all current
   content as customer-owned, the safe assumption), or backfill the seed/demo tenants to
   `spec` if we want the demo to exercise reconcile. Decide in review.
6. **Tests (`test/`).** New cases:
   - rebuild with an item **removed** from the spec deletes only that `spec` row;
   - rebuild **never** deletes an `owner` row (customer-added service survives);
   - a customer **edit** of a `spec` row flips it to `owner` and a later rebuild leaves it;
   - re-running the same spec is still idempotent (no duplicates, no churn);
   - `specKeyFor` unit tests.

## Definition of done

- All existing tests still green; new reconcile tests green.
- Proven: a rebuild removes a dropped service, keeps a customer-added one, and keeps a
  customer-edited one. (Article II: editability re-proven, now across a rebuild.)
- ADR 0001 status updated to "implemented"; backlog item ticked.
- `CHANGELOG.md` updated.

## Out of scope (follow-ups)

- The CRM emitting stable ids per service/testimonial (separate repo + spec-sync test).
  Until then, renames may duplicate; this is documented, not a blocker.
- Reconciling any future spec-driven collections beyond services/testimonials.

## Rough size

Medium. ~5 files touched, one migration, ~5 tests. Half a day of focused work.
The CRM-id follow-up is small but lives in the other repo.
