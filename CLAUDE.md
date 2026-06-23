# CLAUDE.md — deftly-site-template

Guidance for Claude Code working in this repository.

## Status & ground truth (read first)

As of June 2026 this is a **live, deployed, CMS-first single-tenant trade site** (Phase 1
of the BUILD-PLAN — complete). It replaced the previous unstyled scaffold, which is kept
locally in `_graveyard/` for reference only (git-ignored).

**The law is [`CONSTITUTION.md`](./CONSTITUTION.md).** Article I above all: nothing a
customer sees is hardcoded — every word/image is read from Payload at runtime. Before
adding any content to a component, ask "can the customer edit this in the admin panel?"
If not, it belongs in the CMS (a `SiteSettings`/`HomePage` field or a collection).

## Architecture

- `src/app/(frontend)/` — the public site. Own root `layout.tsx` (fonts, header/footer,
  CMS theme vars). `page.tsx` is `force-dynamic` and queries the CMS each request, so
  edits show on reload. `/privacy` renders `SiteSettings.privacyPolicy`.
- `src/app/(payload)/` — Payload admin (`/admin`) + REST/GraphQL API (`/api/*`). Own root
  layout. **There is no `src/app/layout.tsx`** — each route group has its own (intentional).
- `src/collections/` + `src/globals/` — the content model (the single source of truth).
- `src/lib/queries.ts` — all CMS reads (React-cached). `src/lib/seo.ts` — metadata + JSON-LD.
- `src/components/sections/` — one component per homepage section, all CMS-driven.
- `src/seed/` — idempotent seed (demo content + admin user + placeholder media → Blob).

## Conventions / traps (learned the hard way)

- DB adapter is `@payloadcms/db-vercel-postgres` with `push: false` — **use migrations**
  (`npm run migrate:create <name>`), never schema push.
- Media uses Vercel Blob with `disablePayloadAccessControl: true` (public CDN URLs). Never
  commit image files (Article III).
- Run `payload generate:importmap` after changing admin components, or `/admin` renders blank.
- LocalBusiness JSON-LD must **never** include `aggregateRating`/`review` (Google policy);
  ratings are display-only (`SiteSettings.rating`).
- After editing the content model: `npm run generate:types`, then `npm run migrate:create`.

## Definition of done for any change

Editability is proven, not assumed (Article II): if you touch content rendering, verify a
CMS edit propagates to the live page on reload before calling it done.
