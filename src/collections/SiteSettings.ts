import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access/tenant'
import { enforceTenantWrite } from '../access/enforce-tenant-write'

/**
 * SiteSettings — the business's identity, contact details, trust signals, legal
 * footer info and branding. EVERYTHING a customer might change about "who they are"
 * lives here (Constitution Article I). Read publicly; edited by the owner.
 *
 * This was a Payload *global* in the single-tenant template. Globals are single-row
 * and cannot be tenant-scoped, so it is now a collection with the multi-tenant
 * plugin's `isGlobal: true` (one row per tenant, global-like admin UX). Reads go
 * through a tenant-filtered `find` (see src/lib/queries.ts).
 */
export const SiteSettings: CollectionConfig = {
  slug: 'site-settings',
  labels: { singular: 'Site Settings', plural: 'Site Settings' },
  admin: {
    useAsTitle: 'businessName',
    group: 'Settings',
    description: 'Your business details, contact info, trust badges, legal footer and branding.',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: { beforeValidate: [enforceTenantWrite] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // ---------------------------------------------------------------- Business
        {
          label: 'Business',
          fields: [
            { name: 'businessName', type: 'text', required: true, label: 'Business name (shown in header & everywhere)' },
            { name: 'legalName', type: 'text', label: 'Registered company name (for the legal footer, if different)' },
            { name: 'tagline', type: 'text', label: 'Short tagline / strapline' },
            {
              name: 'tradeType',
              type: 'select',
              label: 'Trade type (sets your search-engine business category)',
              defaultValue: 'Plumber',
              options: [
                { label: 'Plumber', value: 'Plumber' },
                { label: 'Heating engineer / HVAC', value: 'HVACBusiness' },
                { label: 'Electrician', value: 'Electrician' },
                { label: 'Roofing contractor', value: 'RoofingContractor' },
                { label: 'General contractor / builder', value: 'GeneralContractor' },
                { label: 'Locksmith', value: 'Locksmith' },
                { label: 'Painter / decorator', value: 'HousePainter' },
                { label: 'Landscaper / gardener', value: 'LandscapingBusiness' },
                { label: 'Other local business', value: 'LocalBusiness' },
              ],
            },
            { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo (optional — falls back to your business name as text)' },
            { name: 'establishedYear', type: 'number', label: 'Year established (e.g. 2008)' },
            {
              name: 'cta',
              type: 'group',
              label: 'Buttons (shown in the header and mobile bar)',
              fields: [
                { name: 'callCaption', type: 'text', label: 'Small text above the phone number in the header', defaultValue: 'Call us today' },
                { name: 'callLabel', type: 'text', label: '"Call" button text', defaultValue: 'Call now' },
                { name: 'quoteLabel', type: 'text', label: '"Get a quote" button text', defaultValue: 'Get a free quote' },
              ],
            },
            {
              name: 'notFound',
              type: 'group',
              label: 'Error page (shown if a visitor hits a missing page)',
              fields: [
                { name: 'heading', type: 'text', label: 'Heading', defaultValue: 'Page not found' },
                { name: 'body', type: 'text', label: 'Message', defaultValue: 'Sorry, we couldn’t find the page you were looking for.' },
                { name: 'backLabel', type: 'text', label: 'Back-to-home button text', defaultValue: 'Back to home' },
              ],
            },
          ],
        },
        // ----------------------------------------------------------------- Contact
        {
          label: 'Contact',
          fields: [
            { name: 'phone', type: 'text', required: true, label: 'Phone number (used for click-to-call — digits only, e.g. 01423555123)' },
            { name: 'phoneDisplay', type: 'text', label: 'Phone shown to visitors (e.g. "01423 555 123") — defaults to the number above' },
            { name: 'email', type: 'email', label: 'Public contact email' },
            { name: 'notificationEmail', type: 'email', label: 'Send new enquiries to this email (defaults to public email)' },
            { name: 'whatsapp', type: 'text', label: 'WhatsApp number (optional — lets customers send photos)' },
            {
              name: 'address',
              type: 'group',
              label: 'Address',
              fields: [
                { name: 'line1', type: 'text' },
                { name: 'line2', type: 'text' },
                { name: 'city', type: 'text', label: 'Town / city' },
                { name: 'county', type: 'text' },
                { name: 'postcode', type: 'text' },
                { name: 'country', type: 'text', defaultValue: 'United Kingdom' },
              ],
            },
            {
              name: 'areasServed',
              type: 'array',
              label: 'Areas you serve (towns / regions)',
              labels: { singular: 'Area', plural: 'Areas' },
              fields: [{ name: 'area', type: 'text', required: true }],
            },
            {
              name: 'openingHours',
              type: 'array',
              label: 'Opening hours',
              labels: { singular: 'Hours row', plural: 'Hours rows' },
              fields: [
                {
                  name: 'days',
                  type: 'select',
                  hasMany: true,
                  options: [
                    { label: 'Monday', value: 'Monday' },
                    { label: 'Tuesday', value: 'Tuesday' },
                    { label: 'Wednesday', value: 'Wednesday' },
                    { label: 'Thursday', value: 'Thursday' },
                    { label: 'Friday', value: 'Friday' },
                    { label: 'Saturday', value: 'Saturday' },
                    { label: 'Sunday', value: 'Sunday' },
                  ],
                },
                { name: 'opens', type: 'text', label: 'Opens (24h, e.g. 08:00)' },
                { name: 'closes', type: 'text', label: 'Closes (24h, e.g. 18:00)' },
                { name: 'closed', type: 'checkbox', label: 'Closed on these days' },
              ],
            },
            { name: 'emergencyText', type: 'text', label: 'Out-of-hours / emergency note (optional, e.g. "24/7 emergency call-outs")' },
          ],
        },
        // ------------------------------------------------------------------- Trust
        {
          label: 'Trust',
          fields: [
            {
              name: 'rating',
              type: 'group',
              label: 'Headline rating (display only — shown near the top)',
              admin: { description: 'For display only. Never published as search-engine review data (against Google policy for self-reported ratings).' },
              fields: [
                { name: 'value', type: 'number', label: 'Rating out of 5 (e.g. 4.9)' },
                { name: 'count', type: 'number', label: 'Number of reviews' },
                { name: 'source', type: 'text', label: 'Where from (e.g. "Google")', defaultValue: 'Google' },
              ],
            },
            {
              name: 'accreditations',
              type: 'array',
              label: 'Accreditations & badges (only ones you genuinely hold)',
              labels: { singular: 'Accreditation', plural: 'Accreditations' },
              fields: [
                { name: 'name', type: 'text', required: true, label: 'Name (e.g. "Gas Safe Registered")' },
                { name: 'registrationNumber', type: 'text', label: 'Registration number (e.g. Gas Safe no.)' },
                { name: 'logo', type: 'upload', relationTo: 'media', label: 'Badge logo (optional)' },
              ],
            },
            { name: 'insuranceText', type: 'text', label: 'Insurance line (e.g. "Fully insured · £2m public liability")' },
            { name: 'guaranteeText', type: 'text', label: 'Guarantee line (e.g. "12-month workmanship guarantee")' },
          ],
        },
        // ----------------------------------------------------------- Legal & footer
        {
          label: 'Legal & footer',
          fields: [
            { name: 'companyNumber', type: 'text', label: 'Companies House number' },
            { name: 'vatNumber', type: 'text', label: 'VAT number (if registered)' },
            { name: 'registeredOffice', type: 'textarea', label: 'Registered office address (for the footer)' },
            { name: 'privacyPageTitle', type: 'text', label: 'Privacy page title/heading', defaultValue: 'Privacy Policy' },
            {
              name: 'privacyPolicy',
              type: 'richText',
              label: 'Privacy policy (shown at /privacy — required as your form collects personal data)',
            },
            {
              name: 'social',
              type: 'group',
              label: 'Social links (optional)',
              fields: [
                { name: 'facebook', type: 'text', label: 'Facebook URL' },
                { name: 'instagram', type: 'text', label: 'Instagram URL' },
              ],
            },
          ],
        },
        // ------------------------------------------------------------ Branding & SEO
        {
          label: 'Branding & SEO',
          fields: [
            { name: 'brandColor', type: 'text', label: 'Brand colour (hex, e.g. #173A5E) — used for headers/footers' },
            { name: 'accentColor', type: 'text', label: 'Accent colour (hex, e.g. #E0620D) — used for buttons/calls-to-action' },
            { name: 'defaultMetaTitle', type: 'text', label: 'Default browser-tab / search title' },
            { name: 'defaultMetaDescription', type: 'textarea', label: 'Default search-result description' },
            { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Social share image (shown when your site is shared on Facebook/WhatsApp)' },
          ],
        },
      ],
    },
  ],
}
