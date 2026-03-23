import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
  },
  fields: [
    // Business Identity
    {
      name: 'businessName',
      type: 'text',
      required: true,
    },
    {
      name: 'tagline',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'email',
      type: 'text',
    },
    {
      name: 'location',
      type: 'text',
    },

    // Branding
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },

    // Hero Section
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'heroHeading',
      type: 'text',
    },
    {
      name: 'heroSubheading',
      type: 'text',
    },

    // About Section
    {
      name: 'aboutHeading',
      type: 'text',
    },
    {
      name: 'aboutText',
      type: 'richText',
    },
    {
      name: 'aboutImage',
      type: 'upload',
      relationTo: 'media',
    },

    // CTA Section
    {
      name: 'ctaHeading',
      type: 'text',
    },
    {
      name: 'ctaText',
      type: 'text',
    },
    {
      name: 'ctaButtonText',
      type: 'text',
    },
    {
      name: 'ctaButtonLink',
      type: 'text',
    },

    // Navigation
    {
      name: 'navLinks',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'href',
          type: 'text',
          required: true,
        },
      ],
    },

    // Social Links
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Twitter / X', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },

    // Footer
    {
      name: 'footerText',
      type: 'text',
    },
  ],
}
