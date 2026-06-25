import type { Access } from 'payload'

import type { User } from '@/payload-types'

/**
 * Multi-tenant access helpers (Stage 1).
 *
 * A "super admin" is the Deftly platform operator: they can see and manage every
 * tenant. Everyone else is a tenant admin, scoped by the multi-tenant plugin to the
 * tenant(s) in their `tenants` array — they only ever read/write their own site.
 *
 * The plugin (`@payloadcms/plugin-multi-tenant`) layers a tenant constraint
 * (`{ tenant: { in: <user's tenants> } }`) on top of these base rules, so these
 * functions only express the coarse "is this person allowed at all" decision.
 */

/** True for the platform operator (bypasses tenant scoping via the plugin). */
export const isSuperAdmin = (user: unknown): boolean =>
  Boolean(user && (user as Partial<User>).isSuperAdmin)

/** Anyone, including unauthenticated visitors. Used for public site content reads. */
export const anyone: Access = () => true

/** Any authenticated user. The plugin narrows this to their own tenant. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/** Only the platform operator. Used where cross-tenant power would be unsafe. */
export const superAdminsOnly: Access = ({ req: { user } }) => isSuperAdmin(user)
