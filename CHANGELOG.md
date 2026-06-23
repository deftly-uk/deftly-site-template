# Changelog

All notable changes to the Deftly Site Template are documented in this file.

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

### Stack
- Next.js 16 + Payload CMS 3.85, `@payloadcms/db-vercel-postgres`, Neon, Vercel Blob,
  Tailwind v4, React 19.
