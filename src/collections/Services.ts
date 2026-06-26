import type { CollectionConfig } from 'payload'

import { authenticated, publicTenantRead } from '../access/tenant'
import { enforceTenantWrite } from '../access/enforce-tenant-write'

/** A service the business offers. Rendered as a card in the Services grid. */
export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'summary', 'order'],
    group: 'Content',
    description: 'The services you offer. These appear as cards on the homepage.',
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
      name: 'title',
      type: 'text',
      required: true,
      label: 'Service name',
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      label: 'Short description (1–2 sentences shown on the card)',
    },
    {
      name: 'icon',
      type: 'select',
      label: 'Icon',
      defaultValue: 'wrench',
      options: [
        { label: 'Wrench (general / repairs)', value: 'wrench' },
        { label: 'Flame (heating / boilers)', value: 'flame' },
        { label: 'Droplet (plumbing / leaks)', value: 'droplet' },
        { label: 'Radiator (radiators / central heating)', value: 'radiator' },
        { label: 'Shower (bathrooms)', value: 'shower' },
        { label: 'Gauge (servicing / safety checks)', value: 'gauge' },
        { label: 'Shield (emergency / cover)', value: 'shield' },
        { label: 'Bolt (power / electrics)', value: 'bolt' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Photo (optional — overrides the icon if set)',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display order (lower shows first)',
      defaultValue: 0,
    },
  ],
}
