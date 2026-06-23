import type { CollectionConfig } from 'payload'

import { adminsOnly, anyone } from '../access'

/**
 * Media — every image on the site. Files are stored in Vercel Blob (Article III);
 * the database keeps only the URL + metadata. Uploaded through the admin panel.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
    description: 'Photos and images. Upload here, then pick them in your page content.',
  },
  access: {
    read: anyone,
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  upload: {
    // Generated automatically by Payload + sharp; served from Blob via next/image.
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 576, position: 'centre' },
      { name: 'feature', width: 1280, height: 854, position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, position: 'centre' },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt text (describe the image for accessibility & SEO)',
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption (optional — e.g. "Boiler install, Harrogate")',
    },
  ],
}
