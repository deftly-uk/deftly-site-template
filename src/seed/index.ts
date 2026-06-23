import { getPayload } from 'payload'
import type { Payload } from 'payload'

import config from '../payload.config'
import { heading, paragraph, richText } from './lexical'
import { upsertImage, type SeedImageSpec } from './images'

/* ---------------------------------------------------------------- image specs */
const HERO: SeedImageSpec = {
  key: 'hero',
  filename: 'seed-hero.jpg',
  alt: 'Plumbing and heating work in a Harrogate home',
  width: 1920,
  height: 1080,
  variant: 'hero',
}
const ABOUT: SeedImageSpec = {
  key: 'about',
  filename: 'seed-about.jpg',
  alt: 'Ashworth Plumbing & Heating engineer at work',
  width: 1280,
  height: 960,
  variant: 'about',
}

/* ----------------------------------------------------------------- collections */
const SERVICES = [
  {
    title: 'Boiler Installation & Repair',
    icon: 'flame',
    order: 1,
    summary:
      'New boiler installs, repairs and annual servicing from a Gas Safe registered engineer. Fixed quotes on trusted brands.',
  },
  {
    title: 'Central Heating',
    icon: 'radiator',
    order: 2,
    summary:
      'Radiator upgrades, power flushing, smart thermostats and full central heating systems designed around your home.',
  },
  {
    title: 'Emergency Plumbing',
    icon: 'shield',
    order: 3,
    summary:
      'Burst pipes, leaks and breakdowns. Fast same-day response to stop the damage and put things right.',
  },
  {
    title: 'Bathroom Installations',
    icon: 'shower',
    order: 4,
    summary:
      'Watertight, beautifully finished bathrooms fitted end to end — from a simple swap to a full refit.',
  },
  {
    title: 'Leaks & Repairs',
    icon: 'droplet',
    order: 5,
    summary:
      'Dripping taps, hidden leaks and dodgy plumbing tracked down and fixed properly — first time.',
  },
  {
    title: 'Landlord Gas Safety',
    icon: 'gauge',
    order: 6,
    summary:
      'CP12 gas safety certificates and annual servicing to keep your tenants safe and you compliant.',
  },
]

const TESTIMONIALS = [
  {
    authorName: 'Sarah M.',
    area: 'Harrogate',
    jobType: 'Boiler replacement',
    rating: 5,
    order: 1,
    quote:
      'Our boiler packed in over a cold weekend and Ashworth had a new one fitted by Monday lunchtime. Tidy, polite and the price they quoted was the price we paid.',
  },
  {
    authorName: 'James T.',
    area: 'Knaresborough',
    jobType: 'Full bathroom refit',
    rating: 5,
    order: 2,
    quote:
      'They refitted our family bathroom start to finish. Brilliant workmanship, kept us updated every day, and left the house spotless. Couldn’t recommend them more.',
  },
  {
    authorName: 'Priya K.',
    area: 'Ripon',
    jobType: 'Emergency leak repair',
    rating: 5,
    order: 3,
    quote:
      'Came out within the hour when we had water coming through the ceiling. Found the leak fast, sorted it, and talked us through exactly what had happened. Lifesavers.',
  },
]

/* ----------------------------------------------------------------------- helpers */
const upsertByField = async (
  payload: Payload,
  collection: 'services' | 'testimonials',
  field: string,
  value: string,
  data: Record<string, unknown>,
): Promise<void> => {
  const found = await payload.find({
    collection,
    where: { [field]: { equals: value } },
    limit: 1,
    depth: 0,
  })
  if (found.docs[0]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.update({ collection, id: found.docs[0].id, data } as any)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection, data } as any)
  }
}

/* -------------------------------------------------------------------------- seed */
const seed = async (): Promise<void> => {
  const payload = await getPayload({ config })

  // 1) Admin user (idempotent) — becomes the CMS login.
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'change-me-strong'
  const existingUser = await payload.find({
    collection: 'users',
    where: { email: { equals: adminEmail } },
    limit: 1,
  })
  if (!existingUser.docs[0]) {
    await payload.create({
      collection: 'users',
      data: { email: adminEmail, password: adminPassword, name: 'Site Owner' },
    })
    payload.logger.info(`Created admin user: ${adminEmail}`)
  } else {
    payload.logger.info(`Admin user already exists: ${adminEmail}`)
  }

  // 2) Images → Vercel Blob (idempotent by filename).
  const heroId = await upsertImage(payload, HERO)
  const aboutId = await upsertImage(payload, ABOUT)
  payload.logger.info(`Media ready (hero #${heroId}, about #${aboutId})`)

  // 3) Services + testimonials.
  for (const s of SERVICES) {
    await upsertByField(payload, 'services', 'title', s.title, s)
  }
  for (const t of TESTIMONIALS) {
    await upsertByField(payload, 'testimonials', 'authorName', t.authorName, t)
  }
  payload.logger.info(`Seeded ${SERVICES.length} services, ${TESTIMONIALS.length} testimonials`)

  // 4) Site settings (the business identity + trust + legal + branding).
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      businessName: 'Ashworth Plumbing & Heating',
      legalName: 'Ashworth Plumbing & Heating Ltd',
      tagline: 'Gas Safe plumbers & heating engineers in Harrogate',
      tradeType: 'Plumber',
      establishedYear: 2009,
      cta: {
        callCaption: 'Call us today',
        callLabel: 'Call now',
        quoteLabel: 'Get a free quote',
      },
      notFound: {
        heading: 'Page not found',
        body: 'Sorry, we couldn’t find that page. Give us a call and we’ll point you the right way.',
        backLabel: 'Back to home',
      },
      phone: '01423555123',
      phoneDisplay: '01423 555 123',
      email: 'hello@ashworthplumbing.co.uk',
      whatsapp: '+447700900123',
      // Demo: routes test enquiries to the account owner so the email can be verified.
      notificationEmail: process.env.CONTACT_TO_EMAIL_FALLBACK || 'hello@ashworthplumbing.co.uk',
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
        { area: 'Boroughbridge' },
        { area: 'Pannal' },
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
        heading('How we use it', 'h3'),
        paragraph(
          'We use your details only to contact you about your enquiry and to provide our services. We do not sell your data. We keep enquiry records for as long as needed to provide our services and meet our legal obligations.',
        ),
        heading('Your rights', 'h3'),
        paragraph(
          'Under UK GDPR you can ask us for a copy of your data, ask us to correct or delete it, or object to how we use it. To do so, contact us using the details on this site. You can also complain to the Information Commissioner’s Office (ICO).',
        ),
      ]),
      brandColor: '#173A5E',
      accentColor: '#E0620D',
      defaultMetaTitle: 'Ashworth Plumbing & Heating | Gas Safe Plumbers in Harrogate',
      defaultMetaDescription:
        'Trusted Gas Safe plumbers and heating engineers in Harrogate & North Yorkshire. Boiler repairs, installations, bathrooms and emergency plumbing. Free quotes — call today.',
      ogImage: heroId,
    },
  })

  // 5) Homepage content.
  await payload.updateGlobal({
    slug: 'home-page',
    data: {
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
      servicesIntro:
        'From a dripping tap to a full boiler installation — one local team you can trust.',
      aboutEyebrow: 'Why choose us',
      aboutHeading: 'Local, Gas Safe, and properly insured',
      aboutBody: richText([
        paragraph(
          'Ashworth Plumbing & Heating is a family-run team based in Harrogate, serving homeowners and landlords across North Yorkshire since 2009. Every engineer is Gas Safe registered, and every job — big or small — is done to the same high standard.',
        ),
        paragraph(
          'We believe in fixed, upfront pricing and tidy, respectful work. No surprises, no mess left behind, and a 12-month guarantee on everything we do.',
        ),
      ]),
      aboutImage: aboutId,
      aboutPoints: [
        { text: 'Gas Safe registered engineers' },
        { text: 'Upfront fixed pricing — no surprises' },
        { text: 'Tidy, respectful and on time' },
        { text: '12-month workmanship guarantee' },
        { text: 'Family-run since 2009' },
        { text: 'Covering Harrogate & North Yorkshire' },
      ],
      testimonialsEyebrow: 'Reviews',
      testimonialsHeading: 'What our customers say',
      testimonialsIntro: 'Real reviews from homeowners across Harrogate & North Yorkshire.',
      contactHeading: 'Get a free, no-obligation quote',
      contactBody:
        'Tell us what you need and we’ll get back to you fast — usually within the hour during working hours.',
      contactCallPrompt: 'Prefer to talk now? Call us:',
      contactReassurances: [
        { text: 'No call-out fee' },
        { text: 'Free fixed quotes' },
        { text: 'We reply within the hour' },
        { text: 'Gas Safe registered' },
      ],
      contactSubmitLabel: 'Request a callback',
      contactSuccessMessage:
        'Thanks — we’ve got your details and will call you back shortly. For anything urgent, call us on 01423 555 123.',
      metaTitle: 'Gas Safe Plumbers & Heating Engineers in Harrogate',
      metaDescription:
        'Boiler repairs, installations, bathrooms and emergency plumbing in Harrogate & North Yorkshire. Gas Safe registered, fully insured, free quotes.',
      ogImage: heroId,
    },
  })

  payload.logger.info('✅ Seed complete.')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
