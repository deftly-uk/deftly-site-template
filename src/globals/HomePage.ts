import type { GlobalConfig } from 'payload'

import { adminsOnly, anyone } from '../access'

/**
 * HomePage — the words and images for each section of the homepage.
 * Services and testimonials come from their own collections; everything else
 * (headlines, body copy, labels, images) is editable here (Constitution Article I).
 */
export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Homepage',
  admin: {
    group: 'Content',
    description: 'The headlines, text and images for each section of your homepage.',
  },
  access: {
    read: anyone,
    update: adminsOnly,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // -------------------------------------------------------------------- Hero
        {
          label: 'Hero',
          fields: [
            { name: 'heroHeadline', type: 'text', required: true, label: 'Main headline (e.g. "Trusted plumbers in Harrogate")' },
            { name: 'heroSubheadline', type: 'textarea', label: 'Reassuring line under the headline' },
            { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Hero background photo' },
            { name: 'heroPrimaryCtaLabel', type: 'text', label: 'Primary button text', defaultValue: 'Call now' },
            { name: 'heroSecondaryCtaLabel', type: 'text', label: 'Secondary button text', defaultValue: 'Get a free quote' },
            { name: 'heroShowRating', type: 'checkbox', label: 'Show the star rating in the hero', defaultValue: true },
          ],
        },
        // ------------------------------------------------------------- Trust strip
        {
          label: 'Trust strip',
          fields: [
            { name: 'trustStripEnabled', type: 'checkbox', label: 'Show the trust strip', defaultValue: true },
            {
              name: 'trustHighlights',
              type: 'array',
              label: 'Quick promises (e.g. "No call-out fee", "Free quotes", "Reply within the hour")',
              labels: { singular: 'Promise', plural: 'Promises' },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
        // ---------------------------------------------------------------- Services
        {
          label: 'Services',
          fields: [
            { name: 'servicesEyebrow', type: 'text', label: 'Small label above the heading', defaultValue: 'Our services' },
            { name: 'servicesHeading', type: 'text', label: 'Section heading', defaultValue: 'What we do' },
            { name: 'servicesIntro', type: 'textarea', label: 'Short intro under the heading (optional)' },
          ],
        },
        // ------------------------------------------------------------------- About
        {
          label: 'About / Why us',
          fields: [
            { name: 'aboutEyebrow', type: 'text', label: 'Small label above the heading', defaultValue: 'Why choose us' },
            { name: 'aboutHeading', type: 'text', label: 'Section heading', defaultValue: 'Why choose us' },
            { name: 'aboutBody', type: 'richText', label: 'About text' },
            { name: 'aboutImage', type: 'upload', relationTo: 'media', label: 'Photo (e.g. team, van, finished job)' },
            {
              name: 'aboutPoints',
              type: 'array',
              label: 'Key reasons / selling points',
              labels: { singular: 'Point', plural: 'Points' },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
        // ------------------------------------------------------------ Testimonials
        {
          label: 'Testimonials',
          fields: [
            { name: 'testimonialsEyebrow', type: 'text', label: 'Small label above the heading', defaultValue: 'Reviews' },
            { name: 'testimonialsHeading', type: 'text', label: 'Section heading', defaultValue: 'What our customers say' },
            { name: 'testimonialsIntro', type: 'textarea', label: 'Short intro (optional)' },
          ],
        },
        // ------------------------------------------------------- Contact / final CTA
        {
          label: 'Contact',
          fields: [
            { name: 'contactHeading', type: 'text', label: 'Section heading', defaultValue: 'Get a free, no-obligation quote' },
            { name: 'contactBody', type: 'textarea', label: 'Short line under the heading' },
            {
              name: 'contactReassurances',
              type: 'array',
              label: 'Reassurances shown by the form',
              labels: { singular: 'Reassurance', plural: 'Reassurances' },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            { name: 'contactCallPrompt', type: 'text', label: 'Text above the phone number in the contact band', defaultValue: 'Prefer to talk now? Call us:' },
            { name: 'contactSubmitLabel', type: 'text', label: 'Send button text', defaultValue: 'Request a callback' },
            { name: 'contactSuccessMessage', type: 'textarea', label: 'Thank-you message after sending', defaultValue: "Thanks — we've got your details and will be in touch shortly." },
          ],
        },
        // --------------------------------------------------------------------- SEO
        {
          label: 'SEO',
          fields: [
            { name: 'metaTitle', type: 'text', label: 'Browser-tab / search title for the homepage' },
            { name: 'metaDescription', type: 'textarea', label: 'Search-result description for the homepage' },
            { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Social share image (overrides the site default)' },
          ],
        },
      ],
    },
  ],
}
