import { PLUMBER_TEMPLATE } from './plumber'
import {
  industryFromTrade,
  iconFromKeywords,
  primaryTown,
  titleCaseTrade,
  type IndustryKey,
  type Template,
} from './shared'

/**
 * Per-industry template registry (Stage 2). A template turns a validated SiteSpec into
 * a fully-populated, on-brand site: supplying the section copy, default trust promises,
 * service icons and stock-image palette the spec doesn't carry. The plumber variant is
 * canonical (./plumber.ts); the rest reuse the same shape with trade-appropriate wording.
 *
 * Everything here is a DEFAULT the customer can edit afterwards (Article I/II).
 */

export type { IndustryKey, Template } from './shared'
export { primaryTown, iconFromKeywords, industryFromTrade } from './shared'

const makeVariant = (
  industry: IndustryKey,
  palette: Template['palette'],
  cmsTradeType: string,
  noun: string,
  highlights: string[],
): Template => ({
  industry,
  palette,
  cmsTradeType,
  copy: {
    servicesEyebrow: 'Our services',
    servicesHeading: `${noun} services`,
    servicesIntro: `Professional ${noun.toLowerCase()} work, done properly and on time.`,
    aboutEyebrow: 'Why choose us',
    aboutHeading: 'Trusted, professional and reliable',
    testimonialsEyebrow: 'Reviews',
    testimonialsHeading: 'What our customers say',
    contactHeading: 'Get a no-obligation quote',
    trustHighlights: highlights,
  },
  serviceIcon: iconFromKeywords,
  heroHeadline: (spec) => spec.story.heroHeadline ?? `${noun} in ${primaryTown(spec)}`,
  heroSubheadline: (spec) =>
    spec.story.whyUs?.slice(0, 160) ??
    `Local, professional and trusted across ${primaryTown(spec)}, with honest advice and tidy, reliable work.`,
  tagline: (spec) => `${titleCaseTrade(spec.identity.tradeType)} in ${primaryTown(spec)}`,
})

// Fallback selling points, shown ONLY when the rep captured none. Kept claim-free:
// anything specific (accreditations like NICEIC, insurance, free quotes, guarantees) is
// shown only when actually captured in the CRM. Defaults describe approach, not facts.
const ELECTRICIAN_TEMPLATE = makeVariant('electrician', 'electrician', 'Electrician', 'Electrical', [
  'Friendly, professional service',
  'Clean, careful and tidy work',
  'Clear quotes and honest advice',
])
const ROOFER_TEMPLATE = makeVariant('roofer', 'roofer', 'RoofingContractor', 'Roofing', [
  'Friendly, professional service',
  'Careful, tidy work',
  'Clear quotes and honest advice',
])
const OTHER_TEMPLATE = makeVariant('other', 'other', 'LocalBusiness', 'Trade', [
  'Friendly, professional service',
  'Careful, tidy work',
  'Reliable local service',
])

const REGISTRY: Record<IndustryKey, Template> = {
  plumber: PLUMBER_TEMPLATE,
  electrician: ELECTRICIAN_TEMPLATE,
  roofer: ROOFER_TEMPLATE,
  other: OTHER_TEMPLATE,
}

/** The template for a given CRM trade slug. Falls back to a generic trade template. */
export const getTemplate = (tradeType: string): Template => REGISTRY[industryFromTrade(tradeType)]
