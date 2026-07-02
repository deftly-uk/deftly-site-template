import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'

import type { Tenant, User } from '@/payload-types'
import { heading, paragraph, richText } from '@/lib/lexical'
import {
  provisionTenantContent,
  upsertTenant,
  upsertTenantAdmin,
  type TenantContent,
  type TenantStatus,
} from '@/lib/provision'
import { upsertTenantImage } from '@/lib/stock-images'
import { getTemplate, primaryTown, type Template } from '@/lib/templates'

import { DEFAULT_ACCENT_COLOR, DEFAULT_BRAND_COLOR, parseSiteSpec, type SiteSpec } from './schema'

/**
 * Spec-driven content loader (Stage 2).
 *
 * Turns the CRM's SiteSpec (the hand-off contract) into a populated, editable tenant in
 * the shared app. Anything the rep left blank falls back to a template default or is
 * auto-generated (hero headline, SEO title, privacy policy); when the customer has no
 * real photos yet, the site launches on tasteful per-industry stock placeholders, which
 * they swap later in the admin panel (Article I/II hold per tenant).
 */

const digits = (s: string): string => s.replace(/[^\d+]/g, '')

/** Auto-generated standard UK privacy policy when the spec carries none. */
const autoPrivacyPolicy = (businessName: string) =>
  richText([
    heading('Privacy Policy'),
    paragraph(
      `${businessName} ("we", "us") is committed to protecting your privacy. This policy explains what personal data we collect through this website and how we use it.`,
    ),
    heading('What we collect', 'h3'),
    paragraph(
      'When you submit our contact form we collect your name, phone number, postcode and any message you send, so we can respond to your enquiry and arrange work.',
    ),
    heading('How we use it', 'h3'),
    paragraph(
      'We use your details only to contact you about your enquiry and to provide our services. We do not sell your data.',
    ),
    heading('Your rights', 'h3'),
    paragraph(
      'Under UK GDPR you can ask us for a copy of your data, ask us to correct or delete it, or object to how we use it. You can also complain to the Information Commissioner’s Office (ICO).',
    ),
  ])

/** Map a validated SiteSpec + its template into a full tenant content bundle. */
export const buildTenantContentFromSpec = (
  spec: SiteSpec,
  template: Template,
  images: { heroId?: number; aboutId?: number; ogImageId?: number },
): TenantContent => {
  const town = primaryTown(spec)
  const businessName = spec.identity.businessName
  const sellingPoints = spec.story.sellingPoints.length ? spec.story.sellingPoints : template.copy.trustHighlights

  // Launch palette: the rep can't yet capture a colour (design picker is a later phase),
  // so when the spec still carries the schema's blank-state default we substitute the
  // template's considered launch palette. A colour the rep genuinely chose is respected.
  const brandColor =
    spec.story.brandColor === DEFAULT_BRAND_COLOR ? template.look?.brandColor ?? spec.story.brandColor : spec.story.brandColor
  const accentColor =
    spec.story.accentColor === DEFAULT_ACCENT_COLOR
      ? template.look?.accentColor ?? spec.story.accentColor
      : spec.story.accentColor

  const rating =
    spec.trust.googleRating != null
      ? { value: spec.trust.googleRating, count: spec.trust.googleReviewCount ?? undefined, source: 'Google' }
      : undefined

  const siteSettings: Record<string, unknown> = {
    businessName,
    legalName: spec.identity.tradingName ?? undefined,
    tagline: template.tagline(spec),
    tradeType: template.cmsTradeType,
    establishedYear: spec.identity.establishedYear ?? undefined,
    phone: digits(spec.contact.customerPhone),
    phoneDisplay: spec.contact.customerPhoneDisplay ?? undefined,
    email: spec.contact.enquiryEmail ?? undefined,
    notificationEmail: spec.contact.notificationEmail ?? spec.contact.enquiryEmail ?? undefined,
    whatsapp: spec.contact.whatsapp ?? undefined,
    address: {
      line1: spec.contact.addressLine ?? undefined,
      city: town,
      postcode: spec.contact.postcode ?? undefined,
      country: 'United Kingdom',
    },
    areasServed: spec.contact.areasServed.map((area) => ({ area })),
    emergencyText: spec.contact.emergencyNote ?? undefined,
    rating,
    accreditations: spec.trust.accreditations.map((a) => ({
      name: a.name,
      registrationNumber: a.registrationNumber ?? undefined,
    })),
    insuranceText: spec.trust.insuranceText ?? undefined,
    guaranteeText: spec.trust.guaranteeText ?? undefined,
    companyNumber: spec.legal.companyNumber ?? undefined,
    vatNumber: spec.legal.vatNumber ?? undefined,
    registeredOffice: spec.legal.registeredOffice ?? undefined,
    privacyPageTitle: 'Privacy Policy',
    privacyPolicy: spec.legal.privacyPolicy
      ? richText([paragraph(spec.legal.privacyPolicy)])
      : autoPrivacyPolicy(businessName),
    brandColor,
    accentColor,
    defaultMetaTitle: `${businessName} | ${template.copy.servicesHeading} in ${town}`,
    defaultMetaDescription: template.heroSubheadline(spec),
    ogImage: images.ogImageId,
  }

  const homePage: Record<string, unknown> = {
    heroHeadline: template.heroHeadline(spec),
    heroSubheadline: template.heroSubheadline(spec),
    // Left unset for the no-photo editorial hero (The Reliable); the customer can add a
    // real hero photo later and it appears automatically (Article I).
    heroImage: images.heroId,
    heroShowRating: spec.trust.googleRating != null,
    trustStripEnabled: true,
    trustHighlights: sellingPoints.slice(0, 4).map((text) => ({ text })),
    servicesEyebrow: template.copy.servicesEyebrow,
    servicesHeading: template.copy.servicesHeading,
    servicesIntro: template.copy.servicesIntro,
    aboutEyebrow: template.copy.aboutEyebrow,
    aboutHeading: template.copy.aboutHeading,
    aboutBody: spec.story.whyUs
      ? richText([paragraph(spec.story.whyUs)])
      : richText([paragraph(`${businessName} is a trusted local team serving ${town} and the surrounding area.`)]),
    aboutImage: images.aboutId,
    aboutPoints: sellingPoints.map((text) => ({ text })),
    testimonialsEyebrow: template.copy.testimonialsEyebrow,
    testimonialsHeading: template.copy.testimonialsHeading,
    contactHeading: template.copy.contactHeading,
    contactReassurances: sellingPoints.slice(0, 4).map((text) => ({ text })),
    metaTitle: `${template.copy.servicesHeading} in ${town}`,
    metaDescription: template.heroSubheadline(spec),
  }

  const services = spec.services.map((s, i) => ({
    title: s.title,
    summary: s.summary ?? `Get in touch to talk about ${s.title.toLowerCase()}.`,
    icon: template.serviceIcon(s.title),
    order: s.isHeadline ? 0 : i + 1,
  }))

  const testimonials = spec.testimonials.map((t, i) => ({
    quote: t.quote,
    authorName: t.authorName ?? 'Verified customer',
    area: t.area ?? undefined,
    jobType: t.jobType ?? undefined,
    rating: 5,
    order: i,
  }))

  return { siteSettings, homePage, services, testimonials }
}

export type LoadTenantOptions = {
  subdomain: string
  status?: TenantStatus
  /** Provision a tenant admin login (default true). */
  provisionAdmin?: boolean
  adminEmail?: string
  adminPassword?: string
}

export type LoadTenantResult = {
  tenant: Tenant
  admin?: User
  /** A generated password, returned only when one was auto-generated (never persisted in clear elsewhere). */
  generatedPassword?: string
}

/**
 * Create (or update) a tenant from a SiteSpec: validate → tenant record → stock images →
 * content → admin login. Idempotent by subdomain, so re-running a build never duplicates.
 */
export const loadTenantFromSpec = async (
  payload: Payload,
  specInput: unknown,
  options: LoadTenantOptions,
): Promise<LoadTenantResult> => {
  const spec = parseSiteSpec(specInput) // throws on an invalid spec — the contract is enforced here
  const template = getTemplate(spec.identity.tradeType)
  const subdomain = options.subdomain.trim().toLowerCase()

  const tenant = await upsertTenant(payload, {
    name: spec.identity.businessName,
    subdomain,
    industry: template.industry,
    status: options.status ?? 'pending',
  })

  // Imagery depends on the template's launch `look`. The editorial look (The Reliable)
  // seeds NO stock imagery — the site renders its clean CSS hero + a centred About block,
  // and the customer adds their own photos later (they appear automatically, Article I).
  // Other templates still launch on tasteful per-industry gradient placeholders.
  const look = template.look
  const businessName = spec.identity.businessName

  let heroId: number | undefined
  let aboutId: number | undefined
  if (!look?.editorial) {
    heroId = await upsertTenantImage(payload, tenant.id, {
      filename: `${subdomain}--hero.jpg`,
      alt: `${businessName} work`,
      width: 1920,
      height: 1080,
      variant: 'hero',
      palette: template.palette,
    })
    aboutId = await upsertTenantImage(payload, tenant.id, {
      filename: `${subdomain}--about.jpg`,
      alt: `${businessName} team at work`,
      width: 1280,
      height: 960,
      variant: 'about',
      palette: template.palette,
    })
  }
  const ogImageId = heroId ?? aboutId

  const content = buildTenantContentFromSpec(spec, template, { heroId, aboutId, ogImageId })
  await provisionTenantContent(payload, tenant.id, content)

  let admin: User | undefined
  let generatedPassword: string | undefined
  if (options.provisionAdmin !== false) {
    const email =
      options.adminEmail ??
      spec.contact.notificationEmail ??
      spec.contact.enquiryEmail ??
      `owner@${subdomain}.deftly.local`
    generatedPassword = options.adminPassword ? undefined : `Df-${randomUUID()}`
    admin = await upsertTenantAdmin(payload, {
      tenantId: tenant.id,
      email,
      password: options.adminPassword ?? generatedPassword!,
      name: `${spec.identity.businessName} owner`,
    })
  }

  return { tenant, admin, generatedPassword }
}
