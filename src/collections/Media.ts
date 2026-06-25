import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access/tenant'
import { enforceTenantWrite } from '../access/enforce-tenant-write'
import { tenantMediaPrefix } from '../lib/storage'

/**
 * Media — every image on the site. Files are stored in Vercel Blob (Article III);
 * the database keeps only the URL + metadata. Uploaded through the admin panel.
 *
 * Multi-tenant: the plugin adds a `tenant` field and scopes access, so a tenant
 * admin can only see/upload their own media. The `prefix` field below namespaces
 * the stored file under `tenants/<subdomain>/...` so storage keys never collide or
 * leak across tenants (set automatically — hidden from the editor).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
    description: 'Photos and images. Upload here, then pick them in your page content.',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: { beforeValidate: [enforceTenantWrite] },
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
    {
      // Per-tenant storage prefix. Consumed by the Vercel Blob adapter in prod; set
      // automatically from the row's tenant, never edited by hand.
      name: 'prefix',
      type: 'text',
      admin: { hidden: true, readOnly: true },
      hooks: {
        beforeChange: [
          async ({ req, data, value }) => {
            const tenantId = data?.tenant
            if (!tenantId) return value ?? ''
            try {
              const tenant = await req.payload.findByID({
                collection: 'tenants',
                id: typeof tenantId === 'object' ? tenantId.id : tenantId,
                depth: 0,
                overrideAccess: true,
              })
              return tenant?.subdomain ? tenantMediaPrefix(tenant.subdomain) : value ?? ''
            } catch {
              return value ?? ''
            }
          },
        ],
      },
    },
  ],
}
