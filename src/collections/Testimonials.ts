import type { CollectionConfig } from 'payload'

import { authenticated, publicTenantRead } from '../access/tenant'
import { enforceTenantWrite } from '../access/enforce-tenant-write'

/**
 * Customer testimonials, entered manually in the CMS.
 * NOTE: these are displayed only. They must NEVER be emitted as aggregateRating/review
 * JSON-LD in our own schema (Google manual-action risk — see BUILD-PLAN design rules).
 */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'authorName',
    defaultColumns: ['authorName', 'area', 'rating', 'order'],
    group: 'Content',
    description: 'Reviews from your customers. Shown on the homepage.',
  },
  access: {
    read: publicTenantRead,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: { beforeValidate: [enforceTenantWrite] },
  defaultSort: 'order',
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      label: 'What the customer said',
    },
    {
      name: 'authorName',
      type: 'text',
      required: true,
      label: 'Customer name',
    },
    {
      name: 'area',
      type: 'text',
      label: 'Their town / area (e.g. "Harrogate")',
    },
    {
      name: 'jobType',
      type: 'text',
      label: 'Job done (e.g. "Boiler replacement")',
    },
    {
      name: 'rating',
      type: 'number',
      label: 'Star rating (1–5)',
      defaultValue: 5,
      min: 1,
      max: 5,
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display order (lower shows first)',
      defaultValue: 0,
    },
  ],
}
