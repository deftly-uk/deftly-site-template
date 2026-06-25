import { parseSiteSpec, SPEC_VERSION, type SiteSpec, type SiteSpecInput } from './schema'

/**
 * A worked plumber SiteSpec — the engine-side fixture matching the CRM's canonical
 * plumber example (deftly-app/src/lib/spec/example.ts). Used to build + test a tenant
 * end to end and as documentation of "what good looks like" coming over the hand-off.
 *
 * Deliberately leaves heroHeadline + brand colours null so the loader's defaulting and
 * auto-generation paths are exercised by the fixture, not just the happy path.
 */
export const PLUMBER_SAMPLE_INPUT: SiteSpecInput = {
  version: SPEC_VERSION,
  identity: {
    businessName: 'Brightwell Plumbing & Heating Ltd',
    tradeType: 'plumbers',
    tradingName: 'Brightwell Plumbing',
    establishedYear: 2009,
    logoUrl: null,
  },
  contact: {
    customerPhone: '+447700900142',
    customerPhoneDisplay: '07700 900142',
    enquiryEmail: 'hello@brightwellplumbing.co.uk',
    notificationEmail: 'james@brightwellplumbing.co.uk',
    whatsapp: '+447700900142',
    contactChannels: ['call', 'text', 'whatsapp'],
    addressLine: '14 Canal Street, Manchester',
    postcode: 'M1 3LE',
    areasServed: ['Manchester', 'Salford', 'Stockport', 'Trafford'],
    serviceRadiusMiles: 20,
    openingHours: 'Mon-Fri 8am-6pm, Sat 9am-1pm, emergency cover 24/7',
    emergencyNote: '24/7 emergency call-out, typically on site within 60 minutes.',
  },
  trust: {
    accreditations: [
      { name: 'Gas Safe', registrationNumber: '123456' },
      { name: 'CIPHE', registrationNumber: 'CIP-9087' },
    ],
    insuranceText: '£2m public liability insurance',
    guaranteeText: '12-month workmanship guarantee on all installations',
    googleRating: 4.8,
    googleReviewCount: 127,
  },
  services: [
    { title: 'Boiler installation & servicing', summary: 'Gas Safe boiler swaps, services and repairs.', isHeadline: true },
    { title: 'Bathroom installation', summary: 'Full bathroom design and fit-out.' },
    { title: 'Emergency leak repair', summary: 'Same-day leaks, burst pipes and blockages.' },
    { title: 'Central heating', summary: 'Radiators, power-flushing and system upgrades.' },
  ],
  testimonials: [
    {
      quote: 'Brightwell sorted our boiler the same day — professional and tidy.',
      authorName: 'Sarah T.',
      area: 'Didsbury',
      jobType: 'Boiler repair',
      source: 'google',
    },
  ],
  story: {
    // heroHeadline intentionally omitted → loader auto-generates it.
    whyUs:
      'Family-run, Gas Safe registered, and trusted across Manchester for over 15 years. Honest pricing and tidy work, every time.',
    sellingPoints: ['Gas Safe registered', 'Family-run since 2009'],
    // brandColor/accentColor omitted → schema defaults applied.
  },
  legal: {
    companyNumber: '06754321',
    vatNumber: 'GB123456789',
    registeredOffice: '14 Canal Street, Manchester, M1 3LE',
  },
  assets: {
    hasRealPhotos: false,
    hasLogo: false,
    assetsNote: '12 recent bathroom/boiler photos coming by end of week + a van photo.',
  },
}

/** The fixture parsed + defaulted — the SiteSpec the engine actually consumes. */
export const PLUMBER_SAMPLE_SPEC: SiteSpec = parseSiteSpec(PLUMBER_SAMPLE_INPUT)
