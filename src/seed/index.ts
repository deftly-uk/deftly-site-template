import { getPayload } from 'payload'
import type { Payload } from 'payload'

import config from '../payload.config'
import { heading, paragraph, richText } from '../lib/lexical'
import { upsertTenantImage, type StockPalette } from '../lib/stock-images'
import {
  provisionTenantContent,
  upsertTenant,
  upsertTenantAdmin,
  type TenantContent,
  type TenantIndustry,
} from '../lib/provision'

/**
 * Demo seed (idempotent). Creates a platform super-admin plus TWO independent demo
 * tenants on one app + one database, each with its own admin login and content:
 *
 *   • Ashworth Plumbing & Heating   → ashworth.localhost
 *   • Pennine Electrical            → pennine.localhost
 *
 * Run after `payload migrate`, then visit each subdomain. Editing one tenant's content
 * never touches the other's — the Stage 1 isolation proof, made tangible.
 */

type DemoTenant = {
  name: string
  subdomain: string
  industry: TenantIndustry
  palette: StockPalette
  adminEmail: string
  build: (imgs: { heroId: number; aboutId: number }) => TenantContent
}

/* ----------------------------------------------------------------- tenant 1: plumber */
const ashworth: DemoTenant = {
  name: 'Ashworth Plumbing & Heating',
  subdomain: 'ashworth',
  industry: 'plumber',
  palette: 'plumber',
  adminEmail: 'owner@ashworth.test',
  build: ({ heroId, aboutId }) => ({
    siteSettings: {
      businessName: 'Ashworth Plumbing & Heating',
      legalName: 'Ashworth Plumbing & Heating Ltd',
      tagline: 'Gas Safe plumbers & heating engineers in Harrogate',
      tradeType: 'Plumber',
      establishedYear: 2009,
      cta: { callCaption: 'Call us today', callLabel: 'Call now', quoteLabel: 'Get a free quote' },
      phone: '01423555123',
      phoneDisplay: '01423 555 123',
      email: 'hello@ashworthplumbing.co.uk',
      whatsapp: '+447700900123',
      notificationEmail: 'hello@ashworthplumbing.co.uk',
      address: {
        line1: 'Unit 4, Claro Court Business Centre',
        city: 'Harrogate',
        county: 'North Yorkshire',
        postcode: 'HG1 4BA',
        country: 'United Kingdom',
      },
      areasServed: [
        { area: 'Harrogate' },
        { area: 'Knaresborough' },
        { area: 'Ripon' },
        { area: 'Wetherby' },
      ],
      openingHours: [
        { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00', closed: false },
        { days: ['Saturday'], opens: '09:00', closes: '13:00', closed: false },
        { days: ['Sunday'], closed: true },
      ],
      emergencyText: '24/7 emergency call-outs for existing customers',
      rating: { value: 4.9, count: 127, source: 'Google' },
      accreditations: [
        { name: 'Gas Safe Registered', registrationNumber: '123456' },
        { name: 'Which? Trusted Trader' },
        { name: 'CIPHE Member' },
      ],
      insuranceText: 'Fully insured · £5m public liability',
      guaranteeText: '12-month workmanship guarantee',
      companyNumber: '08123456',
      vatNumber: 'GB 312 4567 89',
      registeredOffice: 'Unit 4, Claro Court Business Centre, Harrogate, North Yorkshire, HG1 4BA',
      privacyPageTitle: 'Privacy Policy',
      privacyPolicy: richText([
        heading('Privacy Policy'),
        paragraph(
          'Ashworth Plumbing & Heating Ltd ("we", "us") is committed to protecting your privacy. This policy explains what personal data we collect through this website and how we use it.',
        ),
        heading('What we collect', 'h3'),
        paragraph(
          'When you submit our contact form we collect your name, phone number, postcode and any message you send, so we can respond to your enquiry and arrange work.',
        ),
        heading('Your rights', 'h3'),
        paragraph(
          'Under UK GDPR you can ask us for a copy of your data, ask us to correct or delete it, or object to how we use it. You can also complain to the Information Commissioner’s Office (ICO).',
        ),
      ]),
      brandColor: '#173A5E',
      accentColor: '#E0620D',
      defaultMetaTitle: 'Ashworth Plumbing & Heating | Gas Safe Plumbers in Harrogate',
      defaultMetaDescription:
        'Trusted Gas Safe plumbers and heating engineers in Harrogate & North Yorkshire. Boiler repairs, installations, bathrooms and emergency plumbing. Free quotes — call today.',
      ogImage: heroId,
    },
    homePage: {
      heroHeadline: 'Trusted plumbers & heating engineers in Harrogate',
      heroSubheadline:
        'Gas Safe registered, fully insured and rated 4.9 by over 120 local customers. Fast, tidy work with fixed quotes and no call-out fee.',
      heroImage: heroId,
      heroPrimaryCtaLabel: 'Call now',
      heroSecondaryCtaLabel: 'Get a free quote',
      heroShowRating: true,
      trustStripEnabled: true,
      trustHighlights: [
        { text: 'No call-out fee' },
        { text: 'Free no-obligation quotes' },
        { text: 'Same-day emergency response' },
      ],
      servicesEyebrow: 'Our services',
      servicesHeading: 'Plumbing & heating services',
      servicesIntro: 'From a dripping tap to a full boiler installation — one local team you can trust.',
      aboutEyebrow: 'Why choose us',
      aboutHeading: 'Local, Gas Safe, and properly insured',
      aboutBody: richText([
        paragraph(
          'Ashworth Plumbing & Heating is a family-run team based in Harrogate, serving homeowners and landlords across North Yorkshire since 2009. Every engineer is Gas Safe registered.',
        ),
      ]),
      aboutImage: aboutId,
      aboutPoints: [
        { text: 'Gas Safe registered engineers' },
        { text: 'Upfront fixed pricing — no surprises' },
        { text: '12-month workmanship guarantee' },
        { text: 'Family-run since 2009' },
      ],
      testimonialsEyebrow: 'Reviews',
      testimonialsHeading: 'What our customers say',
      contactHeading: 'Get a free, no-obligation quote',
      contactBody: 'Tell us what you need and we’ll get back to you fast — usually within the hour.',
      contactReassurances: [{ text: 'No call-out fee' }, { text: 'Free fixed quotes' }, { text: 'Gas Safe registered' }],
      contactSubmitLabel: 'Request a callback',
      metaTitle: 'Gas Safe Plumbers & Heating Engineers in Harrogate',
    },
    services: [
      { title: 'Boiler Installation & Repair', icon: 'flame', order: 1, summary: 'New boiler installs, repairs and annual servicing from a Gas Safe registered engineer.' },
      { title: 'Central Heating', icon: 'radiator', order: 2, summary: 'Radiator upgrades, power flushing, smart thermostats and full central heating systems.' },
      { title: 'Emergency Plumbing', icon: 'shield', order: 3, summary: 'Burst pipes, leaks and breakdowns. Fast same-day response to stop the damage.' },
      { title: 'Bathroom Installations', icon: 'shower', order: 4, summary: 'Watertight, beautifully finished bathrooms fitted end to end.' },
    ],
    testimonials: [
      { authorName: 'Sarah M.', area: 'Harrogate', jobType: 'Boiler replacement', rating: 5, order: 1, quote: 'Our boiler packed in over a cold weekend and Ashworth had a new one fitted by Monday lunchtime. Tidy, polite and the price quoted was the price we paid.' },
      { authorName: 'James T.', area: 'Knaresborough', jobType: 'Full bathroom refit', rating: 5, order: 2, quote: 'They refitted our family bathroom start to finish. Brilliant workmanship and left the house spotless.' },
    ],
  }),
}

/* ------------------------------------------------------------- tenant 2: electrician */
const pennine: DemoTenant = {
  name: 'Pennine Electrical',
  subdomain: 'pennine',
  industry: 'electrician',
  palette: 'electrician',
  adminEmail: 'owner@pennine.test',
  build: ({ heroId, aboutId }) => ({
    siteSettings: {
      businessName: 'Pennine Electrical',
      legalName: 'Pennine Electrical Services Ltd',
      tagline: 'NICEIC approved electricians in Huddersfield',
      tradeType: 'Electrician',
      establishedYear: 2014,
      cta: { callCaption: 'Speak to an electrician', callLabel: 'Call now', quoteLabel: 'Get a free quote' },
      phone: '01484555200',
      phoneDisplay: '01484 555 200',
      email: 'hello@pennineelectrical.co.uk',
      notificationEmail: 'hello@pennineelectrical.co.uk',
      address: {
        line1: '12 Market Street',
        city: 'Huddersfield',
        county: 'West Yorkshire',
        postcode: 'HD1 2AB',
        country: 'United Kingdom',
      },
      areasServed: [{ area: 'Huddersfield' }, { area: 'Halifax' }, { area: 'Brighouse' }, { area: 'Holmfirth' }],
      openingHours: [
        { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '17:30', closed: false },
        { days: ['Saturday'], opens: '09:00', closes: '12:00', closed: false },
        { days: ['Sunday'], closed: true },
      ],
      emergencyText: '24-hour emergency electrician callout',
      rating: { value: 4.8, count: 89, source: 'Google' },
      accreditations: [
        { name: 'NICEIC Approved Contractor' },
        { name: 'Part P Registered' },
      ],
      insuranceText: 'Fully insured · £2m public liability',
      guaranteeText: 'All work certified & guaranteed',
      brandColor: '#1f2937',
      accentColor: '#f5b301',
      defaultMetaTitle: 'Pennine Electrical | NICEIC Electricians in Huddersfield',
      defaultMetaDescription:
        'NICEIC approved electricians in Huddersfield & West Yorkshire. Rewires, fuse boards, EV chargers, fault finding and 24-hour emergency callout. Free quotes.',
      ogImage: heroId,
    },
    homePage: {
      heroHeadline: 'NICEIC approved electricians in Huddersfield',
      heroSubheadline:
        'Certified, fully insured and rated 4.8 by local homeowners. Rewires, fuse boards, EV chargers and 24-hour emergency callout.',
      heroImage: heroId,
      heroPrimaryCtaLabel: 'Call now',
      heroSecondaryCtaLabel: 'Get a free quote',
      heroShowRating: true,
      trustStripEnabled: true,
      trustHighlights: [{ text: 'NICEIC approved' }, { text: 'Free quotes' }, { text: '24-hour emergency callout' }],
      servicesEyebrow: 'Our services',
      servicesHeading: 'Electrical services',
      servicesIntro: 'From an extra socket to a full rewire — certified, safe and tidy.',
      aboutEyebrow: 'Why choose us',
      aboutHeading: 'Certified, safe and reliable',
      aboutBody: richText([
        paragraph(
          'Pennine Electrical is a NICEIC approved team serving Huddersfield and across West Yorkshire since 2014. Every job is certified and left safe, tidy and tested.',
        ),
      ]),
      aboutImage: aboutId,
      aboutPoints: [
        { text: 'NICEIC approved contractor' },
        { text: 'Part P registered' },
        { text: 'All work certified & guaranteed' },
        { text: 'Established 2014' },
      ],
      testimonialsEyebrow: 'Reviews',
      testimonialsHeading: 'What our customers say',
      contactHeading: 'Get a free electrical quote',
      contactBody: 'Tell us what you need and we’ll get back to you quickly.',
      contactReassurances: [{ text: 'NICEIC approved' }, { text: 'Free quotes' }, { text: 'Certified work' }],
      contactSubmitLabel: 'Request a callback',
      metaTitle: 'NICEIC Electricians in Huddersfield',
    },
    services: [
      { title: 'Rewires & Upgrades', icon: 'bolt', order: 1, summary: 'Full and partial rewires, consumer unit upgrades and fault finding.' },
      { title: 'Fuse Boards', icon: 'gauge', order: 2, summary: 'Modern consumer units with RCD protection, certified to current regs.' },
      { title: 'EV Chargers', icon: 'bolt', order: 3, summary: 'Home EV charge point supply and installation by OZEV-approved installers.' },
      { title: 'Emergency Callout', icon: 'shield', order: 4, summary: '24-hour response for power failures and electrical faults.' },
    ],
    testimonials: [
      { authorName: 'David R.', area: 'Huddersfield', jobType: 'Full rewire', rating: 5, order: 1, quote: 'Pennine rewired our whole house with minimal disruption and left it spotless. Proper professionals.' },
      { authorName: 'Aisha K.', area: 'Halifax', jobType: 'EV charger install', rating: 5, order: 2, quote: 'Fitted our EV charger the same week we called. Tidy job and clearly explained everything.' },
    ],
  }),
}

const DEMO_TENANTS = [ashworth, pennine]

/* -------------------------------------------------------------------------- seed */
const seedTenant = async (payload: Payload, demo: DemoTenant): Promise<void> => {
  const tenant = await upsertTenant(payload, {
    name: demo.name,
    subdomain: demo.subdomain,
    industry: demo.industry,
    status: 'active',
  })

  const heroId = await upsertTenantImage(payload, tenant.id, {
    filename: `${demo.subdomain}--hero.jpg`,
    alt: `${demo.name} work`,
    width: 1920,
    height: 1080,
    variant: 'hero',
    palette: demo.palette,
  })
  const aboutId = await upsertTenantImage(payload, tenant.id, {
    filename: `${demo.subdomain}--about.jpg`,
    alt: `${demo.name} team at work`,
    width: 1280,
    height: 960,
    variant: 'about',
    palette: demo.palette,
  })

  await upsertTenantAdmin(payload, {
    tenantId: tenant.id,
    email: demo.adminEmail,
    password: process.env.SEED_TENANT_PASSWORD || 'change-me-strong',
    name: `${demo.name} owner`,
  })

  await provisionTenantContent(payload, tenant.id, demo.build({ heroId, aboutId }))
  payload.logger.info(`Seeded tenant "${demo.name}" → ${demo.subdomain}.localhost`)
}

const seed = async (): Promise<void> => {
  const payload = await getPayload({ config })

  // Platform operator (super admin): can see/manage every tenant.
  await upsertTenantAdmin(payload, {
    tenantId: (await upsertTenant(payload, { name: 'Deftly Platform', subdomain: 'platform', status: 'active' })).id,
    email: process.env.SEED_ADMIN_EMAIL || 'admin@deftly.test',
    password: process.env.SEED_ADMIN_PASSWORD || 'change-me-strong',
    name: 'Deftly Operator',
    isSuperAdmin: true,
  })

  for (const demo of DEMO_TENANTS) {
    await seedTenant(payload, demo)
  }

  payload.logger.info('✅ Seed complete. Visit ashworth.localhost & pennine.localhost.')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
