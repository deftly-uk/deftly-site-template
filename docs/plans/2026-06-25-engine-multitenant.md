# Engine build — multi-tenant conversion (execution plan)

- **Date:** 2026-06-25
- **Branch:** `engine-multitenant`
- **Scope:** CODE ONLY. Build + test against a local/throwaway Postgres and local
  disk storage. No deploy, no real Vercel/Neon/Blob, no secrets, no email/SMS/payments.
- **Governing law:** `CONSTITUTION.md` Article I (nothing a customer sees is hardcoded)
  and Article II (editability re-proven). These now hold **per tenant**.
- **Source plans:** hub `2026-06-24-engine-build-plan.md` (Stages 1–3) and
  `2026-06-24-crm-intake-plan.md` (the `build_jobs` queue + the SiteSpec contract).

## Decisions already made (not re-litigated)
- Multi-tenant from the start (Vercel "Platforms" pattern): one app, one shared
  Postgres with tenant-scoped rows, one shared Blob with per-tenant path prefixes.
- Keep Payload + Next.js and the existing CMS-first content model; add a tenant dimension.
- The SiteSpec (CRM `deftly-app/src/lib/spec/schema.ts`) is the single source of truth
  for what a site is built from. Mirror it here, keep it in sync, test the sync.
- The shared queue is the `build_jobs` table the CRM writes
  (`deftly-app/supabase/migrations/0006_build_queue.sql`). The engine reads queued jobs
  and drives the lifecycle. Local table of that shape for this code-only run.

## Key technical choice: `@payloadcms/plugin-multi-tenant`
Version-matched to Payload (3.85.1). It adds a `tenant` relationship to each enabled
collection, a `tenants` array to users, and tenant-scoped access constraints
(`{ tenant: { in: <user's tenants> } }`). Super-admins bypass via
`userHasAccessToAllTenants`. This is the official, supported foundation; we do **not**
hand-roll tenant access.

Payload **globals are single-row** and cannot be tenant-scoped, so `SiteSettings` and
`HomePage` become **collections** with the plugin's `isGlobal: true` (one row per tenant,
global-like admin UX). All reads move from `findGlobal` to a tenant-filtered `find`.

The plugin does **not** do hostname routing — we build that: `host` header → subdomain →
tenant, React-cached per request, used to scope every public read.

## Stage 1 — Multi-tenant foundation (keystone)
- `Tenants` collection: `name`, `subdomain` (unique, routing key), `customDomain`,
  `status`, `industry` (template variant). Super-admin manages; tenant-admin reads own.
- Add tenant dimension to Media, Services, Testimonials, Enquiries, SiteSettings, HomePage.
- `Users`: add `isSuperAdmin`; plugin adds the `tenants` array. Tenant-admins are scoped
  to their tenant(s) only.
- Shared storage with a **per-tenant path prefix** (`tenants/<subdomain>/...`). Storage is
  conditional: Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, else local disk for tests.
- Hostname → tenant resolution (`src/lib/tenant.ts`); frontend layout/page/seo/actions made
  tenant-aware. `force-dynamic` reads `host` each request.
- **Done when:** two demo tenants run from one app + one DB on two hostnames, each editable
  independently; isolation tests prove A cannot read/edit/upload/log into B.

## Stage 2 — Plumber template + spec-driven content
- Mirror `SiteSpec` (`src/lib/spec/schema.ts`) + worked plumber fixture; a test asserts it
  stays byte-compatible with the CRM's canonical copy.
- `src/lib/templates/plumber.ts`: sections/defaults/stock-image fallbacks/accreditation set.
- `loadTenantFromSpec(payload, spec, { subdomain })`: spec → tenant + SiteSettings + HomePage
  + Services + Testimonials + admin user, with stock placeholders when assets are absent.
- **Done when:** a sample plumber spec creates a correctly-populated, editable tenant,
  validated against the schema + the fixture.

## Stage 3 — Builder (queue reader)
- Local `build_jobs` table mirroring the CRM shape (raw SQL via `pg`, as it lives in the
  shared control-plane DB, not Payload).
- Worker: claim one queued job with `UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP
  LOCKED LIMIT 1)` (safe against double-processing) → create tenant → load spec content →
  `queued → building → ready` with a placeholder preview URL, or `→ failed` with the error.
- **Done when:** a test job runs end to end (tenant created + content loaded + status ready),
  concurrent claim is proven single-winner, and tenant isolation still holds.

## Testing
- `vitest`. A self-contained `scripts/with-test-db` boots an ephemeral Docker Postgres,
  runs the suite against it, tears down. Schema via Payload `push` in test env (DDL parity
  with the committed migration). Tests: isolation (mandatory), independent-edit, host
  resolution, spec→tenant, queue→build + double-claim.

## Explicitly NOT in this run (later, live, with a human)
Deploy, real Vercel/Neon/Blob provisioning, custom domains, real preview generation,
Stripe, Twilio/email. Stubbed cleanly.
