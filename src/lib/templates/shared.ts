import type { SiteSpec } from '@/lib/spec/schema'
import type { StockPalette } from '@/lib/stock-images'

/**
 * Shared template types + helpers (no imports from sibling template files, so there is
 * no import cycle). See ./index.ts for the registry and ./plumber.ts for the canonical
 * variant.
 */

export type IndustryKey = 'plumber' | 'electrician' | 'roofer' | 'other'

export type Template = {
  industry: IndustryKey
  palette: StockPalette
  /** SiteSettings.tradeType enum value (drives schema.org business subtype). */
  cmsTradeType: string
  copy: {
    servicesEyebrow: string
    servicesHeading: string
    servicesIntro: string
    aboutEyebrow: string
    aboutHeading: string
    testimonialsEyebrow: string
    testimonialsHeading: string
    contactHeading: string
    /** Shown if the customer supplied no selling points of their own. */
    trustHighlights: string[]
  }
  /** Pick a tasteful icon for a service from its title. */
  serviceIcon: (title: string) => string
  /** Auto-generate a hero headline when the spec left it null. */
  heroHeadline: (spec: SiteSpec) => string
  /** A reassuring sub-headline derived from the spec. */
  heroSubheadline: (spec: SiteSpec) => string
  /** A short tagline (header strapline) from the spec. */
  tagline: (spec: SiteSpec) => string
}

/** First town the business serves, for "<trade> in <town>" copy. */
export const primaryTown = (spec: SiteSpec): string =>
  spec.contact.areasServed[0] ?? spec.contact.postcode?.split(' ')[0] ?? 'your area'

/** Keyword → icon slug (icons defined on the Services collection). */
export const iconFromKeywords = (title: string): string => {
  const t = title.toLowerCase()
  if (/(boiler|heating|furnace|warm)/.test(t)) return 'flame'
  if (/(radiator|central heat)/.test(t)) return 'radiator'
  if (/(bath|shower|wet ?room)/.test(t)) return 'shower'
  if (/(leak|tap|drip|drain|pipe|plumb|blockage)/.test(t)) return 'droplet'
  if (/(gas|safety|service|inspect|certificat|cp12)/.test(t)) return 'gauge'
  if (/(emergency|callout|call-out|24)/.test(t)) return 'shield'
  if (/(rewire|electr|socket|fuse|consumer|ev|charger|light|power)/.test(t)) return 'bolt'
  return 'wrench'
}

/** Map a CRM trade slug (e.g. "plumbers") to an industry key. */
export const industryFromTrade = (tradeType: string): IndustryKey => {
  const t = tradeType.toLowerCase()
  if (/(plumb|heating|gas|boiler|hvac)/.test(t)) return 'plumber'
  if (/(electric|spark)/.test(t)) return 'electrician'
  if (/(roof)/.test(t)) return 'roofer'
  return 'other'
}

export const titleCaseTrade = (tradeType: string): string => {
  const cleaned = tradeType.replace(/s$/, '').replace(/[-_]/g, ' ').trim()
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}
