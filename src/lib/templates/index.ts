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
 * a fully-populated, on-brand site — supplying the section copy, default trust promises,
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
    aboutHeading: 'Trusted, certified and reliable',
    testimonialsEyebrow: 'Reviews',
    testimonialsHeading: 'What our customers say',
    contactHeading: 'Get a free, no-obligation quote',
    trustHighlights: highlights,
  },
  serviceIcon: iconFromKeywords,
  heroHeadline: (spec) => spec.story.heroHeadline ?? `${noun} in ${primaryTown(spec)}`,
  heroSubheadline: (spec) =>
    spec.story.whyUs?.slice(0, 160) ??
    `Local, fully insured and trusted across ${primaryTown(spec)}. Free quotes and tidy, reliable work.`,
  tagline: (spec) => `${titleCaseTrade(spec.identity.tradeType)} in ${primaryTown(spec)}`,
})

const ELECTRICIAN_TEMPLATE = makeVariant('electrician', 'electrician', 'Electrician', 'Electrical', [
  'NICEIC approved',
  'Free quotes',
  'Certified, guaranteed work',
])
const ROOFER_TEMPLATE = makeVariant('roofer', 'roofer', 'RoofingContractor', 'Roofing', [
  'Free roof inspections',
  'Fully insured',
  'Workmanship guarantee',
])
const OTHER_TEMPLATE = makeVariant('other', 'other', 'LocalBusiness', 'Trade', [
  'Free quotes',
  'Fully insured',
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
