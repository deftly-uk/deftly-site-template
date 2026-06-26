# Rebuild additive-safe (MVP) — execution plan

- **Date:** 2026-06-26
- **Branch:** `engine-multitenant` (part of the open engine PR; needed live for plumbing test)
- **Relates to:** [ADR 0001](../decisions/0001-rebuild-content-reconciliation.md). This is the
  deliberate MINIMUM safe version; the full ownership model is deferred to Phase 2 (see the
  rev-2 plan `2026-06-26-rebuild-content-reconciliation.md`).
- **Governing law:** `CONSTITUTION.md` Articles I/II. A rebuild must never destroy customer work.
- **Status:** IMPLEMENTED and merged to the branch (commit `827b7e0`). Full suite green (36
  tests). This doc is the record of an already-shipped change, not a proposal: an adversarial
  review should check it against the actual code in `src/lib/provision.ts` and the test in
  `test/stage2-spec-loader.test.ts`.

## Context for a reviewer (read these first)

- The decision and the full design: [ADR 0001](../decisions/0001-rebuild-content-reconciliation.md).
- What Phase 2 will build (the complete ownership model that supersedes this MVP), already
  reviewed once by Codex: [`2026-06-26-rebuild-content-reconciliation.md`](./2026-06-26-rebuild-content-reconciliation.md).
- This MVP is deliberately the smallest safe step so the engine can be stood up for a
  24-hour plumbing test. Anything in the "accepted risks" list below is a known, owned
  trade-off (already captured for Phase 2), **not** an oversight to re-raise as a new bug.

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

## Accepted risks (known + owned, deferred to Phase 2 — not new bugs)

- **Rename = duplicate.** A renamed spec item no longer matches by title, so a rebuild adds
  a fresh copy and the renamed (customer) row stays. Clutter, not data loss. Phase 2 fixes
  this with stable spec ids + reconcile.
- **Removal lingers.** An item dropped from the spec stays on the site. Phase 2 reconciles.
- **Spec edits don't propagate.** Once a row exists, the spec never updates it. This is the
  point (it protects customer edits); Phase 2 adds origin tracking so the engine can keep
  updating its own rows while still never touching owner-edited ones.
- **Mutable-title match key.** Matching is by `title` / `authorName`, which can collide if a
  spec lists two items with the same title (the second would be skipped as "already there").
  A spec with duplicate titles is a content error; Phase 2 moves to stable ids + a loud
  collision check.
- **Concurrency.** Two rebuilds for one tenant at once is not serialized. Additive-only makes
  this low-risk (no deletes), but Phase 2 adds a transaction + per-tenant guard.
- **Seed parity.** The demo seed shares these helpers, so re-seeding no longer refreshes
  existing demo content (wipe the dev DB to reseed). Acceptable for dev.

These are the SAME items Codex raised on the Phase 2 plan; they are intentionally out of
scope for the MVP. A useful adversarial review of THIS doc would instead confirm: the change
is genuinely additive (no overwrite/delete path remains), nothing customer-facing is
hardcoded, the test actually proves edit-survival, and no NEW data-loss path was introduced.

## Size

Tiny. One file changed, one test added, no migration. ~15-30 min of agent work.
