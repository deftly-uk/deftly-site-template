import type { SiteSpec } from '@/lib/spec/schema'

import { iconFromKeywords, primaryTown, type Template } from './shared'

/**
 * The PLUMBER template variant (Stage 2, canonical).
 *
 * Defines how a plumber's SiteSpec becomes a finished site: trade-aware section copy,
 * sensible default trust promises, Gas-Safe-flavoured wording, the plumbing icon set,
 * and an auto-generated hero headline when the rep didn't capture one. Stock imagery
 * uses the blue "plumber" palette (src/lib/stock-images.ts). All of it is editable by
 * the customer afterwards — this is just the starting point.
 */
export const PLUMBER_TEMPLATE: Template = {
  industry: 'plumber',
  palette: 'plumber',
  cmsTradeType: 'Plumber',
  copy: {
    servicesEyebrow: 'Our services',
    servicesHeading: 'Plumbing & heating services',
    servicesIntro: 'From a dripping tap to a full boiler installation — one local team you can trust.',
    aboutEyebrow: 'Why choose us',
    aboutHeading: 'Local, Gas Safe, and properly insured',
    testimonialsEyebrow: 'Reviews',
    testimonialsHeading: 'What our customers say',
    contactHeading: 'Get a free, no-obligation quote',
    trustHighlights: ['No call-out fee', 'Free no-obligation quotes', 'Same-day emergency response'],
  },
  serviceIcon: iconFromKeywords,
  heroHeadline: (spec: SiteSpec) =>
    spec.story.heroHeadline ?? `Trusted plumbers & heating engineers in ${primaryTown(spec)}`,
  heroSubheadline: (spec: SiteSpec) => {
    if (spec.story.whyUs) return spec.story.whyUs.slice(0, 180)
    const rating =
      spec.trust.googleRating != null
        ? `Rated ${spec.trust.googleRating} by ${spec.trust.googleReviewCount ?? 'local'} customers. `
        : ''
    return `${rating}Fully insured, fast and tidy work with fixed quotes and no call-out fee.`
  },
  tagline: (spec: SiteSpec) => {
    const gasSafe = spec.trust.accreditations.some((a) => /gas safe/i.test(a.name))
    return `${gasSafe ? 'Gas Safe ' : ''}plumbers & heating engineers in ${primaryTown(spec)}`
  },
}
