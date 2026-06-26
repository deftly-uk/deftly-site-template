import type { Access, Where } from 'payload'

import type { User } from '@/payload-types'

import { extractSubdomain, normaliseHost } from '@/lib/host'

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

/**
 * Public READ for tenant-scoped content collections (Stage 1 isolation hardening).
 *
 * `read: anyone` was unsafe: the multi-tenant plugin only narrows an *authenticated*
 * user to their own tenant, so an anonymous REST/GraphQL read (`/api/services` etc.)
 * returned rows across every tenant. The public website never relies on this — it reads
 * server-side with `overrideAccess: true` (src/lib/queries.ts) — so we can lock raw API
 * reads down without touching the site.
 *
 * Authenticated callers defer to the plugin (which scopes them to their tenants).
 * Anonymous callers are scoped to the tenant that owns the request hostname, so a public
 * API read can only ever surface that one tenant's content, never another's.
 */
export const publicTenantRead: Access = async ({ req }) => {
  if (req.user) return true // plugin narrows authenticated users to their own tenant(s)

  const host = req.headers?.get?.('host')
  if (!host) return false
  const bareHost = normaliseHost(host)
  const sub = extractSubdomain(bareHost)
  const where: Where = sub
    ? { subdomain: { equals: sub } }
    : { customDomain: { equals: bareHost } }

  const { docs } = await req.payload.find({
    collection: 'tenants',
    where,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const tenantId = docs[0]?.id
  if (tenantId == null) return false
  return { tenant: { equals: tenantId } } as Where
}
