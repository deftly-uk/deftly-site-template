# Changelog

All notable changes to the Deftly Site Template are documented in this file.

## [Unreleased] — engine-multitenant — Phases 3+4: multi-tenant engine (CODE ONLY)

Converts the single-tenant template into the multi-tenant "platform app" (one app +
one database serving many sites by hostname) and builds the site-generation engine on
top. Build + tested locally only; deploy/provisioning is a later live step.

### Added — Stage 1: multi-tenant foundation
- `@payloadcms/plugin-multi-tenant`: a tenant dimension on all content, with access
  scoped to the user's tenant(s); super admins bypass via `userHasAccessToAllTenants`.
- `Tenants` collection (subdomain routing key + optional custom domain); hostname →
  tenant resolution (`src/lib/tenant.ts`); the frontend now renders per tenant.
- `SiteSettings` + `HomePage` moved from single-row globals to per-tenant collections.
- `Users` gain `isSuperAdmin` + per-tenant membership; admin access scoped per tenant.
- `enforceTenantWrite` hook closes the cross-tenant CREATE hole the plugin leaves open.
- Shared storage with a per-tenant path prefix (`tenants/<subdomain>/...`); local-disk
  fallback when no Blob token (dev/tests).
- **Tenant-isolation tests (mandatory):** prove tenant A cannot read/edit/create/delete/
  upload to or log into tenant B's content, media or admin; edits are independent.

### Added — Stage 2: per-industry template + spec-driven content
- Mirrored the CRM `SiteSpec` schema verbatim (single source of truth; sync test).
- Per-industry templates (canonical **plumber** variant + electrician/roofer/generic):
  section copy, default trust promises, service icons, stock-image palette, and
  auto-generated hero headline / SEO / privacy policy.
- `loadTenantFromSpec`: a SiteSpec → a populated, editable tenant with stock placeholders
  when real photos are absent. Idempotent by subdomain.

### Added — Stage 3: the builder (queue reader)
- Local `build_jobs` table mirroring the CRM control-plane shape.
- A worker that safely claims a queued job (`FOR UPDATE SKIP LOCKED`), creates the
  tenant, loads content, and advances `queued → building → ready` (or `→ failed`), with
  a placeholder preview URL. `npm run build:worker` drains the queue.

### Hardened (post-review) — tenant isolation & production safety
- **Anonymous API reads can no longer cross tenants.** Public-readable collections
  (`site-settings`, `home-page`, `services`, `testimonials`, `media`) used `read: anyone`,
  so a raw `/api/...` call returned every tenant's rows. New `publicTenantRead` scopes
  anonymous reads to the request hostname's tenant; the website is unaffected (it reads
  server-side with `overrideAccess`). Pure host parsing moved to `src/lib/host.ts`.
- **Public enquiry creation can no longer pick a tenant.** `enquiries` create dropped from
  `anyone` to `authenticated`; the public form's server action now creates with
  `overrideAccess` after resolving the tenant from the hostname, so a direct API call
  cannot insert a lead under another tenant.
- **The `x-tenant-subdomain` override is no longer trusted in production** (dev/test only,
  or behind `ALLOW_TENANT_HEADER_OVERRIDE=true` for trusted preview envs).
- **Suspended tenants are no longer served publicly** (treated as unresolved → 404).
- **Existing users can be promoted to platform operator** by the seed/provisioner
  (`upsertTenantAdmin` now honours `isSuperAdmin` on update; never demotes).
- **Stranded build jobs recover.** `recoverStaleBuildJobs` requeues any job left in
  `building` past `BUILD_JOB_STALE_MS` (default 15 min); the worker runs it before each
  claim, so a crashed worker no longer strands a job forever.
- Pinned `@payloadcms/plugin-multi-tenant` to exact `3.85.1`; fixed migration whitespace.

### Tooling
- Vitest harness on a throwaway Docker Postgres (`npm test`, fully self-contained); 35
  tests green. Production migration `20260625_173116_multitenant_engine` generated.

## [2.0.0] — 2026-06-23 — Phase 1: first real, editable template

Complete rebuild from scratch as a single-tenant, CMS-first trade site (the prior
unstyled scaffold is preserved locally in `_graveyard/`).

### Added
- **CMS-first content model (Constitution Article I):** every customer-visible value
  is read from Payload at runtime. `SiteSettings` global (business identity, contact,
  trust/accreditations, legal footer, branding, SEO), `HomePage` global (per-section
  copy + images), and `Services`, `Testimonials`, `Media`, `Enquiries`, `Users` collections.
- **Styled homepage:** sticky header with click-to-call, hero, trust strip, services
  grid, about/why-us, testimonials, contact + final-CTA band, footer, mobile call bar.
  Navy + warm-orange trade palette (CMS-overridable), Plus Jakarta Sans + Inter.
- **Contact form:** server-validated, honeypot-protected. Saves each enquiry to the
  CMS (owner's lead inbox) and emails the owner via Resend (recipient from the CMS).
- **SEO:** per-page title/description/Open Graph from the CMS + LocalBusiness JSON-LD
  (trade subtype, areas served, opening hours). No self-authored ratings in schema.
- **Images via Vercel Blob** (Article III): uploaded through the CMS, served from the
  Blob CDN, zero image files in git.
- **Infrastructure:** Neon Postgres (London), public Vercel Blob store, Payload migrations
  (migration mode, not `push`), idempotent seed run against production.
- Deployed live on Vercel (framework preset `nextjs`, build runs migrations + import map).

### Hardened (post-review)
- Moved the last customer-visible strings into the CMS (section eyebrows, header/mobile
  CTA labels, 404 copy, privacy title, contact call prompt) — full Article I compliance.
- Accessibility: white-on-accent buttons + accent text now meet WCAG AA (auto-derived
  `accent-strong` token); testimonial star ratings have a text alternative.
- Security: CMS content escaped in JSON-LD; GraphQL playground disabled in production.
- SEO: added `sitemap.xml` + `robots.txt`; address country mapped to ISO code.

### Stack
- Next.js 16 + Payload CMS 3.85, `@payloadcms/db-vercel-postgres`, Neon, Vercel Blob,
  Tailwind v4, React 19.
