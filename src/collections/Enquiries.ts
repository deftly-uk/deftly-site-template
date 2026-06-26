import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/tenant'
import { enforceTenantWrite } from '../access/enforce-tenant-write'

/**
 * Contact-form submissions. Created by the public form (server-validated, tenant set
 * server-side from the hostname), read only by the business owner in the admin panel —
 * their lead inbox, scoped to their tenant.
 *
 * Creation is NOT `anyone`: that would let a direct REST/GraphQL call insert a lead under
 * any `tenant` it chose, bypassing the hostname-scoped server action. Instead the public
 * `submitEnquiry` server action runs trusted (`overrideAccess: true`) after resolving the
 * tenant from the request host, and direct API creates require auth (and are then tenant-
 * scoped by the plugin + enforceTenantWrite). So a lead can only ever land under its own
 * tenant.
 */
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'postcode', 'status', 'createdAt'],
    group: 'Leads',
    description: 'Enquiries sent through your website contact form.',
  },
  access: {
    // The public form creates enquiries via the trusted server action (overrideAccess);
    // direct API creates require auth. Only the owner can read/manage their own.
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: { beforeValidate: [enforceTenantWrite] },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'postcode',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Won', value: 'won' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'source',
      type: 'text',
      defaultValue: 'website',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
