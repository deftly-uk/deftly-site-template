# Deftly Site Template

A standardised Next.js + Payload CMS template for client websites. All pages query the CMS, all images live in Vercel Blob (not git), and a seed script handles initial content population.

## Stack

- **Next.js 16** — App Router with route groups
- **Payload CMS v3** — Admin panel at `/admin`
- **Neon Postgres** — via `@payloadcms/db-vercel-postgres`
- **Vercel Blob** — media storage via `@payloadcms/storage-vercel-blob`
- **Tailwind CSS v4**

## How to Use

### 1. Clone the template

Use GitHub's "Use this template" button, or:

```bash
gh repo create my-client-site --template hm293/deftly-site-template --private --clone
cd my-client-site
npm install
```

### 2. Set up environment

Create `.env` with:

```
DATABASE_URI=postgresql://...
PAYLOAD_SECRET=your-secret-here
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

### 3. Edit site-content.json

Fill in the business name, services, testimonials, gallery items, and image filenames.

### 4. Add images

Place client images in `raw-images/`. Run:

```bash
npm run curate
```

This analyses, optimises, and copies A+B rated images to `public/uploads/`.

### 5. Run Claude Code

Copy the generation kit into the repo root (`CLAUDE.md`, `design-brief-template.md`). Claude reads CLAUDE.md and follows the 8-step workflow — restyling existing components rather than building from scratch.

### 6. Seed the CMS

```bash
npm run seed
```

This uploads images to the Media collection (→ Vercel Blob) and creates all CMS entries from `site-content.json`.

### 7. Deploy

```bash
npm run go-live -- --project-name my-client-site
```

## CMS Collections

| Collection | Fields |
|-----------|--------|
| **Services** | title, slug, description (richText), image, icon, sortOrder |
| **Testimonials** | name, role, quote, rating (1-5), image, sortOrder |
| **Gallery** | title, image, category, description, sortOrder |
| **Media** | alt (+ Payload defaults: filename, url, width, height) |
| **Users** | Standard Payload auth |

### SiteSettings Global

Business identity (name, tagline, phone, email, location), branding (logo), hero section, about section, CTA, navigation links, social links, footer text.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run seed` | Seed CMS from site-content.json |
| `npm run curate` | Analyse and optimise raw images |
| `npm run go-live` | Full deployment automation |
| `npm run generate:importmap` | Regenerate Payload admin import map |
