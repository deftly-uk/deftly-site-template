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
import { getPreset } from '@/lib/presets'

import { parseSiteSpec, type SiteSpec } from './schema'

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

  // The chosen design preset (drives palette, fonts, hero style and section order).
  const preset = getPreset(spec.story.designStyle)

  // Colour: a colour the rep genuinely captured is ALWAYS respected. When they
  // captured none it is null, and we apply the chosen preset's launch palette.
  // (No sentinel-hex comparison — null is the only "not captured" signal.)
  const brandColor = spec.story.brandColor ?? preset.palette.brand
  const accentColor = spec.story.accentColor ?? preset.palette.accent

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
    designStyle: preset.designStyle,
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

  // Imagery depends on the chosen design preset. The photo-led look (Friendly Local)
  // seeds tasteful per-industry stock placeholders; the editorial (The Reliable) and
  // emergency looks seed NO stock imagery — they render a considered CSS hero + a
  // centred About block. Either way the customer adds their own photos later and they
  // appear automatically (Article I).
  const preset = getPreset(spec.story.designStyle)
  const businessName = spec.identity.businessName

  let heroId: number | undefined
  let aboutId: number | undefined
  if (preset.seedImagery) {
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
