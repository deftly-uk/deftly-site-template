/* ============================================================================
   The SITE SPEC — the one canonical, versioned contract between the CRM and the
   website engine (CRM-intake plan §"The spec"; engine plan Stage 2).
//
   This file is the SINGLE SOURCE OF TRUTH for what a saved intake produces and
   what the engine consumes. Both sides build to it; it must not be duplicated.
   Anything not captured by the rep falls back to a sensible default here, or is
   left null for the engine to auto-generate (e.g. SEO titles from name + trade
   + town). When the shape changes, bump SPEC_VERSION and add a migration note.
   ============================================================================ */
import { z } from "zod";

/** Bump on any breaking change to the spec shape. Stamped onto every saved
 *  spec + every build job, so the engine can branch on what it was handed. */
export const SPEC_VERSION = 1 as const;

/** Brand defaults used when the customer has no colours of their own yet. */
export const DEFAULT_BRAND_COLOR = "#1e3a8a"; // deep "trustworthy trade" blue
export const DEFAULT_ACCENT_COLOR = "#f97316"; // call-to-action orange

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "must be a 6-digit hex colour, e.g. #1e3a8a");

const trimmed = z.string().trim();
const nonEmpty = trimmed.min(1);

/* — Identity ─────────────────────────────────────────────────────────────── */
export const identitySchema = z.object({
  businessName: nonEmpty.max(200),
  /** Trade slug (e.g. "plumbers"), drives trade-aware copy + accreditations. */
  tradeType: nonEmpty.max(60),
  /** Owner's trading name if different from the registered/business name. */
  tradingName: trimmed.max(200).nullable().default(null),
  establishedYear: z
    .number()
    .int()
    .min(1850)
    .max(2100)
    .nullable()
    .default(null),
  /** A real uploaded logo URL, or null → engine uses a generated wordmark. */
  logoUrl: trimmed.url().nullable().default(null),
});

/* — Contact ──────────────────────────────────────────────────────────────── */
export const contactSchema = z.object({
  /** E.164 number customers should ring. */
  customerPhone: nonEmpty.max(20),
  /** Pretty display form of the same number (cosmetic). */
  customerPhoneDisplay: trimmed.max(30).nullable().default(null),
  enquiryEmail: trimmed.email().nullable().default(null),
  /** Where lead/enquiry alerts are sent (may differ from the public address). */
  notificationEmail: trimmed.email().nullable().default(null),
  whatsapp: trimmed.max(20).nullable().default(null),
  /** Preferred contact channels the customer is happy to receive. */
  contactChannels: z
    .array(z.enum(["call", "text", "whatsapp", "email"]))
    .default(["call"]),
  addressLine: trimmed.max(300).nullable().default(null),
  postcode: trimmed.max(12).nullable().default(null),
  /** Towns / areas served, shown as coverage + seeds local SEO. */
  areasServed: z.array(nonEmpty.max(80)).max(40).default([]),
  /** Rough travel radius in miles, if the rep captured one. */
  serviceRadiusMiles: z.number().int().min(0).max(500).nullable().default(null),
  openingHours: trimmed.max(500).nullable().default(null),
  /** Emergency / out-of-hours note (e.g. "24/7 callout, ~45 min response"). */
  emergencyNote: trimmed.max(500).nullable().default(null),
});

/* — Trust ────────────────────────────────────────────────────────────────── */
export const accreditationSchema = z.object({
  /** e.g. "Gas Safe", "NICEIC". Legally sensitive — only what they hold. */
  name: nonEmpty.max(120),
  registrationNumber: trimmed.max(60).nullable().default(null),
  /** Badge image URL once supplied, else null → engine omits the badge. */
  badgeUrl: trimmed.url().nullable().default(null),
});
export type Accreditation = z.infer<typeof accreditationSchema>;

export const trustSchema = z.object({
  accreditations: z.array(accreditationSchema).max(20).default([]),
  insuranceText: trimmed.max(300).nullable().default(null),
  guaranteeText: trimmed.max(300).nullable().default(null),
  /** Google star rating — DISPLAY ONLY. Never emitted as JSON-LD review/rating
   *  (template CONSTITUTION + Google policy); the engine renders it as text. */
  googleRating: z.number().min(0).max(5).nullable().default(null),
  googleReviewCount: z.number().int().min(0).nullable().default(null),
});

/* — Services ─────────────────────────────────────────────────────────────── */
export const serviceSchema = z.object({
  title: nonEmpty.max(120),
  summary: trimmed.max(400).nullable().default(null),
  /** Optional icon slug or photo URL; null → engine picks a tasteful default. */
  iconOrPhoto: trimmed.max(400).nullable().default(null),
  /** Flagged by the rep as the customer's biggest earner (hero placement). */
  isHeadline: z.boolean().default(false),
});
export type Service = z.infer<typeof serviceSchema>;

/* — Proof (testimonials) ─────────────────────────────────────────────────── */
export const testimonialSchema = z.object({
  quote: nonEmpty.max(800),
  authorName: trimmed.max(120).nullable().default(null),
  area: trimmed.max(80).nullable().default(null),
  jobType: trimmed.max(120).nullable().default(null),
  /** "google" when seeded from the Google reviews already held on the lead. */
  source: z.enum(["google", "supplied", "other"]).default("supplied"),
});
export type Testimonial = z.infer<typeof testimonialSchema>;

/* — Story & look ─────────────────────────────────────────────────────────── */
export const storySchema = z.object({
  /** Null → engine auto-generates from business name + trade + town. */
  heroHeadline: trimmed.max(160).nullable().default(null),
  whyUs: trimmed.max(2000).nullable().default(null),
  sellingPoints: z.array(nonEmpty.max(160)).max(12).default([]),
  brandColor: hexColor.default(DEFAULT_BRAND_COLOR),
  accentColor: hexColor.default(DEFAULT_ACCENT_COLOR),
});

/* — Legal ────────────────────────────────────────────────────────────────── */
export const legalSchema = z.object({
  /** Only populated for a registered/VAT business — else all null. */
  companyNumber: trimmed.max(20).nullable().default(null),
  vatNumber: trimmed.max(20).nullable().default(null),
  registeredOffice: trimmed.max(300).nullable().default(null),
  /** Null → engine inserts a standard generated privacy policy. */
  privacyPolicy: trimmed.max(20000).nullable().default(null),
});

/* — Assets flag ──────────────────────────────────────────────────────────── */
export const assetsSchema = z.object({
  /** True once real job photos exist; false → site launches on stock
   *  placeholders and real photos are added later (template supports this). */
  hasRealPhotos: z.boolean().default(false),
  hasLogo: z.boolean().default(false),
  /** Rep's note on what's coming (e.g. "12 bathroom photos by Friday"). */
  assetsNote: trimmed.max(500).nullable().default(null),
});

/* — The whole spec ───────────────────────────────────────────────────────── */
export const siteSpecSchema = z.object({
  /** Stamped from SPEC_VERSION at build time; validated on read. */
  version: z.literal(SPEC_VERSION),
  identity: identitySchema,
  contact: contactSchema,
  trust: trustSchema,
  services: z.array(serviceSchema).min(1).max(6),
  testimonials: z.array(testimonialSchema).max(20).default([]),
  story: storySchema,
  legal: legalSchema,
  assets: assetsSchema,
});

/** Output type (after defaults applied) — what's persisted + handed to the engine. */
export type SiteSpec = z.infer<typeof siteSpecSchema>;
/** Input type (before defaults) — what a builder may pass in. */
export type SiteSpecInput = z.input<typeof siteSpecSchema>;

/** Parse + apply defaults, throwing on an invalid spec. */
export function parseSiteSpec(value: unknown): SiteSpec {
  return siteSpecSchema.parse(value);
}

/** Safe variant for boundaries that must not throw (e.g. reading old rows). */
export function safeParseSiteSpec(value: unknown) {
  return siteSpecSchema.safeParse(value);
}
