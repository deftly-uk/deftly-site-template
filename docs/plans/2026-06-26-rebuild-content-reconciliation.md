# Rebuild content reconciliation (execution plan)

- **Date:** 2026-06-26 (rev 2, after Codex review)
- **Branch:** new branch off `main` (e.g. `rebuild-reconciliation`)
- **Decision being implemented:** [ADR 0001](../decisions/0001-rebuild-content-reconciliation.md),
  Option 2 (tag engine-generated content). Backlog item: Phase 4.
- **Governing law:** `CONSTITUTION.md` Articles I and II. The customer owns and can edit
  everything; a rebuild must never destroy the customer's own work.

## The problem (one line)

When a site is rebuilt from its spec, the rebuild must update and clean up only the
content **the engine generated**, and never touch content the **customer** added or edited,
across **all** tenant content: `services`, `testimonials`, **and** the per-tenant globals
`site-settings` and `home-page`.

## Decision recap

- Tag every engine-generated row with its origin (`spec` vs `owner`).
- **List collections (`services`, `testimonials`):** on rebuild, upsert the spec's items,
  delete `spec`-origin rows gone from the spec, leave `owner`-origin rows alone.
- **Per-tenant globals (`site-settings`, `home-page`):** on rebuild, write them only while
  they are still `spec`-origin. Once the customer edits one, it becomes `owner` and the
  engine never overwrites it again ("freeze after first edit").
- When a customer edits any `spec` row in the admin, promote it to `owner`.

## Open question carried forward: renames (NOT blocking)

The CRM spec (`serviceSchema` / `testimonialSchema`) has **no stable id per item** today;
items are identified only by their text.

- **Removals** are handled now (an item absent from the new spec is removed).
- **Renames** cannot be distinguished from "delete old + add new" without a stable id, so a
  rename may briefly create a duplicate until the old row is tidied by hand.

This plan **ships without rename support on purpose** and does **not** claim to fully close
the PR #2 rename feedback. We will: (a) keep the PR thread / a follow-up item open, and
(b) deliver renames properly once the CRM emits stable ids (see follow-ups). This is a
deliberate, documented limitation, not a complete fix.

## Ownership model (the core design)

1. **`origin` field** on `services`, `testimonials`, `site-settings`, `home-page`:
   `select` of `spec` | `owner`, default `owner`, `admin: { hidden: true, readOnly: true }`.
   Default `owner` is the safe default (hand-made content is the customer's).
2. **`specKey` field** (list collections only): `text`, `admin: { hidden: true, readOnly:
   true }`, the stable match key. Stores the CRM id once it exists; until then a derived key.
3. **Server-side protection (not just the admin UI).** `admin.hidden`/`readOnly` only hide
   fields in the admin screen; they do **not** stop API writes. Add **field-level access** so
   only trusted system writes (no `req.user`) can set `origin`/`specKey`:
   `access: { create: ({ req }) => !req.user, update: ({ req }) => !req.user }`. User-supplied
   values for these fields are ignored. A tenant admin therefore cannot relabel their own
   content as `spec` (and make it deletable) or vice versa.
4. **Edit-promotion hook** (`beforeChange` on all four collections): if there is an
   authenticated `req.user` (a real admin edit, not a system write) and the existing row is
   `origin: 'spec'`, set `origin: 'owner'`. System writes (`overrideAccess`, no user) keep
   `spec`. This is what makes a customer's edit "stick".

## Migration & backfill policy (DECIDED, was the "decide later" gap)

Defaulting every existing row to `owner` is safe for data, but then the first rebuild would
not match existing generated rows by `specKey` and would **duplicate every service and
testimonial**. So the migration must backfill, and the policy depends on a fact about the
current state:

- **Today there are no real, customer-edited tenants** (the engine is not deployed; all
  existing content is seed/demo/engine-generated). Therefore the migration **backfills all
  existing `services`/`testimonials` to `origin: 'spec'` with their derived `specKey`, and
  the existing per-tenant globals to `origin: 'spec'`.** The first rebuild then matches
  cleanly: no duplicates.
- This is recorded as an explicit assumption. If this migration is ever run against a DB
  that already holds genuine customer edits, the backfill must be revisited (those rows
  should stay `owner`). A test asserts the first post-migration rebuild produces no
  duplicates and no churn for an existing tenant.

## Match key (collision-safe)

`specKeyFor(item)` derives a stable key from the item's normalized text (slug of `title`
for services; hash of `authorName + quote` for testimonials). Because `slug(title)` is not
guaranteed unique within one spec, the builder **fails the build loudly** if two spec items
produce the same key (a spec with two identical service titles is a content error, not
something to silently collapse). This is unit-tested. Real CRM ids later remove the
ambiguity entirely.

## Steps

1. **Schema.** Add `origin` to `Services`, `Testimonials`, `SiteSettings`, `HomePage`; add
   `specKey` to `Services`, `Testimonials`. Field-level access as above. `npm run
   generate:types`.
2. **Key helper.** `specKeyFor` + collision check. Pure, unit-tested.
3. **Provisioning (`src/lib/provision.ts`).**
   - `upsertTenantDoc`: match by `{ tenant, specKey }`; write `origin: 'spec'` + `specKey`;
     skip rows already `origin: 'owner'`. Reads must pass `showHiddenFields: true` so the
     existing `origin`/`specKey` are actually returned (Payload omits hidden fields by
     default).
   - `upsertTenantGlobal`: skip the write entirely if the existing global is `origin:
     'owner'`; otherwise write with `origin: 'spec'`.
   - `provisionTenantContent`: after upserting the spec list items, **reconcile**: delete
     `services`/`testimonials` where `tenant = X AND origin = 'spec' AND specKey NOT IN
     (<spec keys>)`. `owner` rows are untouched by construction.
4. **Atomicity & concurrency.** Run the whole per-tenant upsert + reconcile inside **one
   Payload transaction** (`req.transactionID`) so a mid-way failure cannot leave a tenant
   half-reconciled. Guarantee **one active rebuild per tenant** (the build worker must not
   process two jobs for the same tenant at once: add a per-tenant guard / advisory lock, or
   a partial unique index on in-flight jobs). Tested for the concurrent + failure cases.
5. **Edit-promotion hook** on all four collections.
6. **Migration.** `npm run migrate:create rebuild_origin_tagging`, including the backfill
   above.
7. **Tests** (see below).

## Tests (`test/`)

- removal: a rebuild deletes only the `spec` row dropped from the spec;
- owner survival (lists): a customer-added service survives a rebuild;
- **globals survival:** an edited `site-settings` value (e.g. phone) and an edited
  `home-page` value survive a rebuild;
- edit-promotion: editing a `spec` row flips it to `owner`; a later rebuild leaves it;
- **existing-data / migration:** first rebuild after the backfill produces no duplicates and
  no churn for an existing tenant;
- **API tampering:** an authenticated tenant user cannot set/alter `origin` or `specKey` via
  the API;
- **concurrency / failure:** a failed rebuild does not partially delete; two rebuilds for one
  tenant do not corrupt its content;
- idempotence: re-running the same spec changes nothing;
- collision: two spec items with the same derived key fail the build loudly;
- `specKeyFor` unit tests.
- **renames:** a test exists and is marked as a known limitation (xfail/skipped with a note),
  not a passing claim.

## Definition of done

- All existing tests green; new tests green (rename test explicitly pending).
- Proven across a rebuild: a dropped service is removed; a customer-added service survives;
  a customer-edited service survives; **edited site-settings and home-page values survive.**
  (Article II re-proven across a rebuild, for all content.)
- No duplicates on the first rebuild after migration.
- ADR 0001 status updated to "implemented (renames pending CRM ids)"; backlog item updated.
- `CHANGELOG.md` updated.

## Out of scope (follow-ups)

- **CRM stable ids per service/testimonial.** A *small but real* follow-up (not one line):
  it needs the mirrored spec-schema change here, type generation, a migration to backfill
  `specKey` from derived keys to real ids, tests for rename + removal, and coordination in
  the CRM repo. Delivering it switches `specKeyFor` to use the id and makes renames update
  in place. Tracked separately; keeps the PR #2 rename thread open until done.
- **Field-level ownership for the globals** (so the engine can keep updating spec-owned
  fields the customer has not touched, instead of freezing the whole row after one edit).
  Whole-row "freeze after first edit" ships now; field-level is a later refinement if needed.
- Reconciling any future spec-driven collections beyond these four.

## Rough size

**Medium-to-large**, revised up after the review. Now includes the globals, server-side
field protection, the migration backfill, transaction/concurrency handling, and a wider
test set. Realistically **~8-10 files, one migration, ~10 tests, around 1.5-2 days** of
focused work. Single agent, end to end (the pieces are tightly coupled and data-loss
sensitive). The CRM-id follow-up is separate and lives in the other repo.

---

## Review round 1 (Codex) — incorporated

Folded into the plan above: globals protection (Critical); migration/backfill policy
decided (High); server-side `origin`/`specKey` protection (High); transaction + per-tenant
serialization (High); `showHiddenFields` on reads (Medium); collision-safe match key
(Medium); wider tests including globals, migration, tampering, concurrency, rename
(Medium); exact field-config wording and a realistic size/CRM-follow-up description (Low).
Renames remain a deliberate, documented limitation rather than a blocker (see above).
