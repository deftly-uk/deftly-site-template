# Deftly Site Template

A single-tenant, **CMS-first** website template for UK trade businesses (plumbers,
heating engineers, electricians, etc.). Built with Next.js 16 + Payload CMS v3. Every
word and image a customer sees is editable from their admin panel — nothing is hardcoded.

> Governed by [`CONSTITUTION.md`](./CONSTITUTION.md). Article I above all: **if a customer
> can see it, they can change it.**
>
> Current status, key decisions, known rough edges, and the full roadmap (Phase 2 features,
> Phase 3 multi-tenant, and engineering to-dos) live in
> [`PRODUCT-BACKLOG.md`](./PRODUCT-BACKLOG.md).

## Stack

- **Next.js 16** (App Router, two route groups: `(frontend)` and `(payload)`)
- **Payload CMS 3.85** — content model, admin panel, local API
- **Neon Postgres** via `@payloadcms/db-vercel-postgres` (migration mode)
- **Vercel Blob** for media (`@payloadcms/storage-vercel-blob`) — no images in git
- **Tailwind v4**, React 19, Resend for enquiry emails

## What's editable (all from the admin panel)

| Where | What |
|---|---|
| **Site Settings** | Business name, phone, email, address, areas served, opening hours, accreditations, rating, insurance/guarantee lines, company/VAT numbers, registered office, privacy policy, brand + accent colours, default SEO |
| **Homepage** | Every section's heading, body copy, button labels, images, success message, page SEO |
| **Services** | Each service card (name, description, icon/photo, order) |
| **Testimonials** | Each review (quote, name, area, job, rating) |
| **Media** | All photos (uploaded to Blob) |
| **Enquiries** | Contact-form leads (the owner's inbox) |

## Local development

```bash
cp .env.example .env        # fill in Neon, Blob, Payload secret, Resend
npm install
npm run migrate             # apply DB migrations
npm run seed                # populate demo content + admin user (idempotent)
npm run dev                 # http://localhost:3000  (admin at /admin)
```

## Key scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm run migrate` · `npm run migrate:create <name>` · `npm run migrate:status`
- `npm run generate:types` · `npm run generate:importmap`
- `npm run seed` — idempotent; upserts content and uploads placeholder media to Blob

## Deployment (Vercel)

- Framework preset: **nextjs** (set explicitly — auto-detection 404s)
- Build command: `payload migrate && payload generate:importmap && next build`
- Required env: `POSTGRES_URL`, `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`,
  `BLOB_READ_WRITE_TOKEN`, and (optional) `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`,
  `CONTACT_TO_EMAIL_FALLBACK`.

The Blob store must be **public**. Pages are `force-dynamic`, so CMS edits appear on reload.

## Email

Contact-form notifications use Resend. Without `RESEND_API_KEY`, enquiries **still save**
to the CMS — only the email is skipped. The recipient comes from
`SiteSettings.notificationEmail` (CMS), falling back to `CONTACT_TO_EMAIL_FALLBACK`.
