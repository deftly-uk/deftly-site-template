import type { SiteSpec } from '@/lib/spec/schema'

import { iconFromKeywords, primaryTown, type Template } from './shared'

/**
 * The PLUMBER template variant (Stage 2, canonical).
 *
 * Defines how a plumber's SiteSpec becomes a finished site: trade-aware section copy in a
 * warm, customer-problem voice, sensible default trust promises, Gas-Safe-flavoured
 * wording, the plumbing icon set, an auto-generated hero headline when the rep didn't
 * capture one, and the default launch "look" (The Reliable: a clean, no-photo
 * editorial-trust design with a considered navy/orange palette).
 * All of it is editable by the customer afterwards (Article I); this is just a strong
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
    // Accreditation-neutral by default: "Gas Safe" is a legally protected registration,
    // so we never assert it in generic copy. It surfaces only where it's genuinely held
    // (the tagline gates it on a Gas Safe accreditation; accreditations render as trust
    // chips). A customer who is Gas Safe registered can add it to this heading in /admin.
    aboutHeading: 'Local, qualified and genuinely reliable',
    testimonialsEyebrow: 'Reviews',
    testimonialsHeading: 'What our customers say',
    contactHeading: 'Get your no-obligation quote',
    // Fallback selling points, shown ONLY when the rep captured none. Kept deliberately
    // claim-free: specific promises (no call-out fee, free quotes, same-day/emergency,
    // "fully insured", accreditations) are shown only when actually captured in the CRM
    // (they flow in via sellingPoints, the insurance field and accreditation chips).
    // Defaults describe our approach, never an unverified fact about this plumber.
    trustHighlights: [
      'Friendly, professional service',
      'Clean, tidy and respectful of your home',
      'Clear quotes and honest advice',
      'Local plumbers, happy to help',
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
    return `${rating}Friendly local plumbers for repairs, boilers and bathrooms, with honest advice and tidy, careful work.`
  },
  tagline: (spec: SiteSpec) => {
    const gasSafe = spec.trust.accreditations.some((a) => /gas safe/i.test(a.name))
    return `${gasSafe ? 'Gas Safe ' : ''}plumbers & heating engineers in ${primaryTown(spec)}`
  },
}
