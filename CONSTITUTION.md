# The Deftly Constitution

**Status:** Foundational. These are laws, not preferences.
**Applies to:** The site template and every customer site cloned from it, forever.
**Last updated:** 2026-06-22

---

## Why this document exists

The first two customer sites (Bracken, Wilding) were built by hand and shipped with a
**decorative CMS** — collections existed, the admin panel loaded, but the pages hardcoded
their content in the code. The customer could log in and change things, and nothing on the
site changed. They could not edit the site they paid for.

This is the single most important failure to never repeat. Everything below exists to
prevent it. When in doubt, re-read Article I.

---

## Article I — Nothing is hardcoded outside the CMS

**Every word, image, and piece of content a customer might ever want to change must come
from the CMS at runtime. No exceptions.**

- No business name, tagline, phone number, service description, testimonial, opening hours,
  "about" text, or image path may be written directly into a component, page, or config file.
- Every page queries the CMS for its content. If a page renders content that isn't in the
  CMS, that is a defect, not a shortcut.
- A page that "works" but hardcodes its content has **failed**, even if it looks perfect.
- The test is brutal and simple: *if the customer can see it on their site, they must be
  able to change it from their admin panel.*

## Article II — Editability is proven, not assumed

**A site is not "done" until editability has been verified by actually doing it.**

- Before any site is considered complete, log into the admin panel, change a real piece of
  content (e.g. the phone number or a service description), reload the live site, and
  confirm the change appears.
- "The CMS is wired up" is not a claim that can be made from reading code. It is only true
  once someone has watched a change propagate from admin panel to live page.
- This check is mandatory and non-skippable. It is the gate between "built" and "shipped."

## Article III — Images live in storage, not in the repo

- Image *files* live in Vercel Blob. The database stores only the reference (URL) to them.
- No raw image files are committed to git. Not in `public/uploads/`, not anywhere.
- Images are uploaded through the CMS (which puts them in Blob); pages read image
  references from the CMS. A customer swapping a photo never requires a code change or redeploy.
- (The Wilding build committed 64.8 MB of raw photos to git. This must never recur.)

## Article IV — The customer owns their content and their ability to edit it

- The product being sold is not "a website." It is "a website the customer controls."
- Self-editability is the core value proposition and the core retention mechanism. Anything
  that erodes it — hardcoding, fragile seed steps, broken admin panels — attacks the
  product itself.
- The admin panel is the customer's. It should be clean, working, and obvious. Branding it
  lightly (a logo) is fine; breaking or neglecting it is not.

## Article V — One source of truth, kept thin

- Content has exactly one home: the CMS. Configuration has exactly one home. Do not
  duplicate the same fact in two places where it can drift out of sync.
- Keep the integration with any third-party tool (Payload, hosting APIs, etc.) thin and
  replaceable. Do not weave a dependency so deeply through the codebase that it can't be
  swapped or upgraded.

## Article VI — Build what works before automating it

- Never automate a process that has not first worked correctly by hand, end to end.
- The order is always: make one thing genuinely work → prove it → then scale or automate it.
- A broken process, automated, is just a faster way to produce broken output. (The original
  orchestrator automated a pipeline that had never once produced a working, editable site.
  This is why it never shipped.)

## Article VII — Simplicity first, features later

- The first version is the smallest thing that is genuinely sellable and genuinely editable.
  Not the most featureful. Not the most polished. The smallest *correct* thing.
- Features are added once the foundation is proven and live, not before. It is far easier
  and safer to add to a working, correct system than to retrofit correctness into a
  feature-rich but broken one.

---

## The one-line version

**If a customer can see it, they can change it — and we have proven they can by doing it
ourselves before we ship.**

Everything else is commentary.
