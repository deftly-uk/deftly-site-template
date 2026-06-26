import type { CollectionConfig } from 'payload'

import { authenticated, superAdminsOnly } from '../access/tenant'

/**
 * Tenants — the "site" record. One row per customer site in the shared app.
 *
 * `subdomain` is the routing key: a request to `acme.deftly.app` (or `acme.localhost`
 * in dev) resolves to the tenant whose subdomain is `acme`, and every public read is
 * then scoped to that tenant. `customDomain` lets a live site answer on its own domain.
 *
 * The multi-tenant plugin adds tenant scoping to the *content* collections; this is the
 * collection they all point at. Access here is managed by the plugin too: the platform
 * operator (super admin) sees every tenant, a tenant admin only sees their own.
 */
export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'subdomain', 'status', 'industry'],
    group: 'Platform',
    description: 'Customer sites. One row per site served by this app.',
  },
  access: {
    // The plugin narrows read to the tenants in the user's `tenants` array;
    // creating/editing/deleting tenants is a platform-operator action only.
    create: superAdminsOnly,
    read: authenticated,
    update: superAdminsOnly,
    delete: superAdminsOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Site / business name',
    },
    {
      name: 'subdomain',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Subdomain (routing key, e.g. "acme" → acme.deftly.app)',
      admin: { description: 'Lowercase letters, numbers and hyphens only. Used to route requests.' },
      hooks: {
        // Normalise so routing (which lowercases the host) always matches.
        beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)],
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string' || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)) {
          return 'Use lowercase letters, numbers and hyphens only (no leading/trailing hyphen).'
        }
        return true
      },
    },
    {
      name: 'customDomain',
      type: 'text',
      unique: true,
      label: 'Custom domain (optional, e.g. "acmeplumbing.co.uk")',
      admin: { description: 'Attached manually in the live session; resolves to this tenant when set.' },
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null)],
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending (building / preview)', value: 'pending' },
        { label: 'Active (live)', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'industry',
      type: 'select',
      required: true,
      defaultValue: 'plumber',
      label: 'Industry template variant',
      options: [
        { label: 'Plumber', value: 'plumber' },
        { label: 'Electrician', value: 'electrician' },
        { label: 'Roofer', value: 'roofer' },
        { label: 'Other trade', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
