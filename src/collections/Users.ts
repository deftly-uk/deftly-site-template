import type { CollectionConfig } from 'payload'

import { authenticated, isSuperAdmin, superAdminsOnly } from '../access/tenant'

/**
 * Users — people who can log into the admin panel.
 *
 * Auth is global (one login table), but the multi-tenant plugin adds a `tenants`
 * array to every user and scopes their data access to those tenants. So a tenant
 * admin authenticates, then only ever sees and edits their own site's content; they
 * cannot reach another tenant's data even on another tenant's admin URL.
 *
 * `isSuperAdmin` marks the Deftly platform operator, who bypasses tenant scoping
 * (wired via `userHasAccessToAllTenants` in payload.config.ts).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Platform',
    description: 'People who can log in and edit a site.',
  },
  access: {
    // Provisioning users (and granting tenant membership) is a platform action.
    // Tenant admins can read within their own tenant; the plugin enforces the scope.
    create: superAdminsOnly,
    read: authenticated,
    update: superAdminsOnly,
    delete: superAdminsOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Full name',
    },
    {
      name: 'isSuperAdmin',
      type: 'checkbox',
      label: 'Platform operator (can access every tenant)',
      defaultValue: false,
      // Only an existing super admin can grant super-admin; nobody can self-promote.
      access: {
        create: ({ req: { user } }) => isSuperAdmin(user),
        update: ({ req: { user } }) => isSuperAdmin(user),
      },
      admin: { position: 'sidebar' },
    },
    // NOTE: the `tenants` array field is injected by @payloadcms/plugin-multi-tenant.
  ],
}
