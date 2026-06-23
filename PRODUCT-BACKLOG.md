# Deftly Site Template: Status & Product Backlog

Where this template stands today, the decisions behind it, what is still rough, and what
comes next. Pairs with [`CONSTITUTION.md`](./CONSTITUTION.md) (the law) and the phased
BUILD-PLAN (the strategy). Last updated: 2026-06-23.

---

## Where we are

**Phase 1 is complete and live.** One real, single-tenant trade website that a customer can
genuinely log into and edit. The Phase 1 gate has been met: change a value in the admin panel,
reload the live site, see it change.

- Live site: https://deftly-site-template.vercel.app
- Admin panel: https://deftly-site-template.vercel.app/admin
- Demo content: a fictional plumbing and heating firm (Ashworth Plumbing & Heating, Harrogate).

---

## 1. What got built (Phase 1)

- A styled, mobile-first **homepage** with these sections, in conversion-led order: sticky
  header with click-to-call, hero, trust strip, services grid, about / why-us, testimonials,
  contact form with a call-to-action band, footer, and a fixed mobile call bar.
- **Everything a customer sees comes from the CMS** (Constitution Article I). Business name,
  phone, email, address, opening hours, areas served, accreditations, services, testimonials,
  every heading and label, the privacy policy, even the brand and accent colours.
- A **privacy page** driven by CMS content (legally required, since the form collects personal data).
- A **contact form** that validates on the server, blocks spam with a honeypot, saves every
  enquiry into the admin (the owner's lead inbox), and emails the owner via Resend.
- **SEO from the CMS**: page title, description, social-share image, a Google "LocalBusiness"
  data block (with no self-reported star ratings, which keeps the site safe from Google
  penalties), plus a sitemap and robots file.
- **Images live in Vercel Blob**, uploaded through the CMS, with zero image files in the code
  (Constitution Article III).
- **Deployed on Vercel** with the admin panel working, on Neon Postgres (London), using proper
  database migrations rather than ad-hoc schema changes.
- A quality pass: a multi-agent review raised 16 real issues (accessibility, security, SEO,
  no-hardcoding) and all were fixed.

**Stack:** Next.js 16, Payload CMS 3.85, Neon Postgres, Vercel Blob, Tailwind v4, React 19, Resend.

---

## 2. Key decisions (and why)

- **Built fresh, single-tenant, not on the old orchestrator.** The orchestrator assumes one
  Vercel project and database per customer, which does not scale and was the wrong foundation.
  We prove one editable site first, then make it multi-tenant later (Phase 3).
- **CMS-first, no exceptions.** The previous two builds shipped a "decorative CMS" where the
  pages hardcoded their content. This build reads every visible value from the CMS at runtime.
- **Pages render fresh on every request** (no caching), so an edit in the admin panel shows the
  moment you reload. Simple and correct for now; we will add smart caching later for speed.
- **Database migrations from day one** (not auto-schema-push), so production never hits schema
  drift problems later.
- **Brand and accent colours are editable in the CMS.** The accent colour auto-darkens behind
  the scenes so buttons always stay readable (meet accessibility contrast) whatever colour a
  customer picks.
- **Placeholder images are generated, not stock photos.** Real customer photos beat everything;
  the seed creates clean, on-brand gradient placeholders that the customer replaces with their
  own. Nothing is committed to the code.

---

## 3. What's still rough (known limitations)

- **Images are placeholders.** The hero and about photos are generated gradients, not real
  photography. They look intentional but are meant to be swapped for the customer's own photos.
  Service cards currently use icons rather than photos.
- **No logo uploaded.** The header shows the business name as styled text (the fallback). The
  logo field exists in the CMS and is ready; nothing has been uploaded to it yet.
- **No favicon** (the little browser-tab icon). Will fall out of the logo work.
- **Email is wired but switched off.** It needs a Resend API key (see backlog). Until then,
  enquiries still save to the admin; only the email notification is skipped.
- **Mistyped URLs show a plain "page not found"** rather than the branded one. The branded,
  editable 404 applies inside the app. Minor, and fine for now.
- **Single page only.** No separate service pages, gallery, or blog yet (intentional for Phase 1).
- **No automated tests or CI pipeline yet**, and no error monitoring.
- **A visual polish pass is still wanted** (the owner's own note). Spacing, imagery, and overall
  finish can be tightened.

---

## 4. Backlog

### Near-term polish (before, or at, the first real customer)

- [ ] **Add real photos** via the CMS: hero, about, and ideally a photo per service card.
- [ ] **Upload the Deftly (or client) logo** into the CMS so it shows in the header, and use it
      as the favicon.
- [ ] **Add a Resend API key** and verify a sending domain so enquiry emails actually send (and
      come from a branded address, not the shared `onboarding@resend.dev`).
- [ ] **Visual polish pass**: imagery, spacing, finish.
- [ ] **Wire Payload's email adapter** to Resend so admin password resets work.

### Phase 2: make the one template excellent and complete

- [ ] Multi-page structure (individual service pages, a gallery), still all CMS-first.
- [ ] Google Business Profile reviews, synced into the CMS and shown (replaces manual testimonials).
- [ ] SMS lead alerts (Twilio) on top of the email alert.
- [ ] The monthly "you got N enquiries" retention email to the owner.
- [ ] Richer local SEO and answer-engine optimisation.
- [ ] Deeper visual polish (this is where a visual design tool can help once the plumbing is solid).

### Phase 3: multi-tenant conversion

- [ ] One Next.js app serving many customer domains (hostname routing).
- [ ] One shared Neon database with tenant-scoped rows (each customer sees only their data).
- [ ] One shared Blob store with per-tenant path prefixes.
- [ ] This is the architecture that makes the economics work at hundreds-to-thousands of sites.

### Phase 4: automation / the engine

- [ ] The generate, preview, pay, promote pipeline (a cleaned-up successor to the orchestrator,
      built around a template that actually works).
- [ ] Custom domain handling (likely Deftly buys and holds the domain on the customer's behalf).
- [ ] Human-review vs full-automation decision for generation quality.

### Engineering hygiene (cross-cutting, do alongside the above)

- [ ] Automated tests, including one that exercises the editability gate end to end.
- [ ] CI pipeline (lint, type-check, build) and connect the GitHub repo to Vercel for preview
      deploys on every push.
- [ ] Smart caching with on-demand refresh (rebuild a page only when its content changes),
      instead of rendering every request fresh, for speed.
- [ ] Error monitoring (e.g. Sentry) and uptime checks.
- [ ] A real-device performance and accessibility audit (Lighthouse / Core Web Vitals / axe).
- [ ] Change the default admin password and set up proper per-user logins for real customers.
- [ ] A branded 404 for mistyped URLs.
- [ ] A database backup routine for Neon.
- [ ] Tidy the em dashes in code comments and commit messages (house style is to avoid them).

---

## Definition of done (carried forward from the Constitution)

Every addition is held to the same bar: nothing a customer sees is hardcoded, and editability is
re-proven by actually doing it before anything is called shipped.
