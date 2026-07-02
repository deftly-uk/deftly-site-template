import type { SiteSpec } from '@/lib/spec/schema'

import { iconFromKeywords, primaryTown, type Template } from './shared'

/**
 * The PLUMBER template variant (Stage 2, canonical).
 *
 * Defines how a plumber's SiteSpec becomes a finished site: trade-aware section copy in a
 * warm, customer-problem voice, sensible default trust promises, Gas-Safe-flavoured
 * wording, the plumbing icon set, an auto-generated hero headline when the rep didn't
 * capture one, and the default launch "look" (The Reliable — a clean, no-photo
 * editorial-trust design with a considered navy/orange palette).
 * All of it is editable by the customer afterwards (Article I) — this is just a strong
 * starting point.
 */
export const PLUMBER_TEMPLATE: Template = {
  industry: 'plumber',
  palette: 'plumber',
  cmsTradeType: 'Plumber',
  look: {
    // The Reliable: no stock imagery (clean editorial hero + centred About), and a
    // considered launch palette used when the rep captured no colour of their own.
    editorial: true,
    brandColor: '#14324f', // deep, trustworthy editorial navy
    accentColor: '#e0620d', // warm, grounded call-to-action orange
  },
  copy: {
    servicesEyebrow: 'What we do',
    servicesHeading: 'Plumbing & heating services',
    servicesIntro:
      'From a dripping tap to a new boiler, one local team you can count on to turn up on time and get it right.',
    aboutEyebrow: 'Why choose us',
    aboutHeading: 'Local, Gas Safe and genuinely reliable',
    testimonialsEyebrow: 'Reviews',
    testimonialsHeading: 'What our customers say',
    contactHeading: 'Get your free, no-obligation quote',
    trustHighlights: [
      'No call-out fee',
      'Free, no-obligation quotes',
      'Same-day emergency callouts',
      'Clean, tidy and respectful of your home',
    ],
  },
  serviceIcon: iconFromKeywords,
  heroHeadline: (spec: SiteSpec) =>
    spec.story.heroHeadline ?? `Local plumbers in ${primaryTown(spec)} you can rely on`,
  heroSubheadline: (spec: SiteSpec) => {
    if (spec.story.whyUs) return spec.story.whyUs.slice(0, 180)
    const rating =
      spec.trust.googleRating != null
        ? `Rated ${spec.trust.googleRating} by ${spec.trust.googleReviewCount ?? 'local'} customers. `
        : ''
    return `${rating}Friendly, fully-insured plumbers for repairs, boilers and bathrooms. Fixed quotes, no call-out fee, and we always tidy up after ourselves.`
  },
  tagline: (spec: SiteSpec) => {
    const gasSafe = spec.trust.accreditations.some((a) => /gas safe/i.test(a.name))
    return `${gasSafe ? 'Gas Safe ' : ''}plumbers & heating engineers in ${primaryTown(spec)}`
  },
}
