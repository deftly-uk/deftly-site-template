# CLAUDE.md — deftly-site-template

Guidance for Claude Code working in this repository.

## Status & ground truth (read first)

This is the **base template every Deftly client site is cloned from** — but as of June 2026 it's an **unstyled, single-commit scaffold that has never been deployed live**. The CMS-first wiring is in place (pages query Payload, seed script present); the look-and-feel and a proven deploy flow are not. No real customer site has been generated from it yet.

When asked how it works, **read `src/` and the scripts**, not just the README. Known gaps and the platform-wide plan live in the master plan (canonical, written from the code):
`https://github.com/hm293/deftly-orchestrator/blob/main/docs/plans/2026-06-14-deftly-platform-master-plan.md`

## What this repo is

Next.js 16 + Payload CMS v3 template: Services / Testimonials / Gallery / Media collections, a SiteSettings global, Vercel Blob media, Neon Postgres, and a seed script that populates content from `site-content.json`.

## Where it sits in the platform

The `deftly-orchestrator` engine clones this repo per customer, restyles it via Claude Code, seeds content, and deploys it. Making this a real, styled template is the **#1 blocker** for that engine.

## Next steps

Style it into a sellable template; prove the seed + go-live flow end-to-end (add the `/api/seed` route the orchestrator calls); deploy one real site from it. Note: this repo now lives under the `deftly-uk` org (older docs may say `hm293`).
