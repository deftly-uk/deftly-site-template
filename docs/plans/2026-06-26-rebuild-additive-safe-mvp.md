# Rebuild additive-safe (MVP) — execution plan

- **Date:** 2026-06-26
- **Branch:** `engine-multitenant` (part of the open engine PR; needed live for plumbing test)
- **Relates to:** [ADR 0001](../decisions/0001-rebuild-content-reconciliation.md). This is the
  deliberate MINIMUM safe version; the full ownership model is deferred to Phase 2 (see the
  rev-2 plan `2026-06-26-rebuild-content-reconciliation.md`).
- **Governing law:** `CONSTITUTION.md` Articles I/II. A rebuild must never destroy customer work.

## Goal

Make a rebuild **additive only**: it adds new content from the spec but never overwrites or
deletes content that already exists. This removes all rebuild data-loss risk with no schema
change and no migration. Enough to stand the engine up and test the plumbing now.

## What it does NOT do (accepted, deferred to Phase 2)

- A renamed item appears as a new row (the old one lingers) = harmless duplicate to tidy by hand.
- A removed item stays on the site.
- Spec edits to an existing item do not propagate on rebuild.
These are cosmetic/staleness costs, not data loss. The full model (ADR 0001) fixes them.

## Change (one file: `src/lib/provision.ts`)

- `upsertTenantGlobal` (`site-settings`, `home-page`): if the tenant's row already exists,
  **skip** (leave it). Only create when missing. Protects customer edits to settings/home page.
- `upsertTenantDoc` (`services`, `testimonials`): if a row already matches (`tenant` +
  match field), **skip**. Only create genuinely new items. Never update, never delete.
- `upsertTenant` and `upsertTenantAdmin` are **unchanged**: the tenant record and admin login
  are platform-managed metadata, not customer content, so they may keep updating on rebuild.
- Function names kept as-is for a minimal blast radius; comments updated to say "create-if-absent".

## Note on the seed

The demo seed shares these helpers, so re-seeding will likewise stop refreshing existing
demo content (it just won't duplicate). Acceptable for now; wipe the dev DB to re-seed fresh.

## Tests (`test/stage2-spec-loader.test.ts`)

- Existing idempotency + editability tests must still pass (they only assert counts and a
  post-edit value, both unaffected).
- **Add:** a customer edit survives a rebuild. Edit a service's `summary` and a
  `site-settings` field as the owner, re-run `loadTenantFromSpec` with the same spec, and
  assert both edits are intact (not overwritten).

## Definition of done

- New additive-safety test green; full suite green (`npm test`).
- `CHANGELOG.md` updated with the MVP behaviour + its known limitations.
- ADR 0001 / Phase-2 plan already record that this is the interim baseline.

## Size

Tiny. One file changed, one test added, no migration. ~15-30 min of agent work.
