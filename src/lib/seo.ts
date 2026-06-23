import type { Metadata } from 'next'

import type { HomePage, SiteSetting } from '@/payload-types'
import { getImage } from '@/lib/media'

export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// schema.org LocalBusiness subtypes we support; anything else falls back to LocalBusiness.
const VALID_SUBTYPES = new Set([
  'Plumber',
  'Electrician',
  'RoofingContractor',
  'GeneralContractor',
  'Locksmith',
  'HousePainter',
  'HVACBusiness',
])

const subtype = (tradeType?: string | null): string =>
  tradeType && VALID_SUBTYPES.has(tradeType) ? tradeType : 'LocalBusiness'

// Map a CMS country display name to an ISO 3166-1 alpha-2 code for structured data.
const COUNTRY_CODES: Record<string, string> = {
  'united kingdom': 'GB',
  'great britain': 'GB',
  uk: 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  'northern ireland': 'GB',
  ireland: 'IE',
}
const countryCode = (country?: string | null): string => {
  if (!country) return 'GB'
  return COUNTRY_CODES[country.trim().toLowerCase()] || 'GB'
}

/**
 * LocalBusiness JSON-LD derived entirely from CMS content.
 * HARD RULE: never includes aggregateRating/review — self-authored ratings risk a
 * Google manual action (BUILD-PLAN design rules). Ratings stay display-only.
 */
export const buildLocalBusinessJsonLd = (
  settings: SiteSetting,
): Record<string, unknown> => {
  const image = getImage(settings.ogImage, 'feature')
  const addr = settings.address

  const openingHoursSpecification = (settings.openingHours || [])
    .filter((row) => !row.closed && row.opens && row.closes && row.days?.length)
    .map((row) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: row.days,
      opens: row.opens,
      closes: row.closes,
    }))

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': subtype(settings.tradeType),
    name: settings.businessName,
    url: SERVER_URL,
  }

  if (settings.legalName) json.legalName = settings.legalName
  if (settings.tagline) json.description = settings.tagline
  if (settings.phone) json.telephone = settings.phone
  if (settings.email) json.email = settings.email
  if (image) json.image = image.url
  if (settings.establishedYear) json.foundingDate = String(settings.establishedYear)
  if (settings.vatNumber) json.vatID = settings.vatNumber

  if (addr && (addr.line1 || addr.city || addr.postcode)) {
    json.address = {
      '@type': 'PostalAddress',
      streetAddress: [addr.line1, addr.line2].filter(Boolean).join(', ') || undefined,
      addressLocality: addr.city || undefined,
      addressRegion: addr.county || undefined,
      postalCode: addr.postcode || undefined,
      addressCountry: countryCode(addr.country),
    }
  }

  const areas = (settings.areasServed || []).map((a) => a.area).filter(Boolean)
  if (areas.length > 0) json.areaServed = areas

  if (openingHoursSpecification.length > 0) json.openingHoursSpecification = openingHoursSpecification

  return json
}

/** Homepage metadata from CMS, falling back through HomePage → SiteSettings → name. */
export const buildHomeMetadata = (settings: SiteSetting, home: HomePage): Metadata => {
  const title =
    home.metaTitle?.trim() ||
    settings.defaultMetaTitle?.trim() ||
    [settings.businessName, settings.tagline].filter(Boolean).join(' — ')
  const description =
    home.metaDescription?.trim() ||
    settings.defaultMetaDescription?.trim() ||
    settings.tagline ||
    undefined
  const og = getImage(home.ogImage, 'feature') || getImage(settings.ogImage, 'feature')

  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: {
      title,
      description,
      url: SERVER_URL,
      siteName: settings.businessName,
      locale: 'en_GB',
      type: 'website',
      images: og ? [{ url: og.url, width: og.width, height: og.height }] : undefined,
    },
    twitter: {
      card: og ? 'summary_large_image' : 'summary',
      title,
      description,
      images: og ? [og.url] : undefined,
    },
  }
}
