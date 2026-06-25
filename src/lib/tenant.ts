import { cache } from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import type { Tenant } from '@/payload-types'

import { getPayloadClient } from './payload'
import { extractSubdomain, normaliseHost } from './host'

/**
 * Hostname → tenant resolution (Stage 1).
 *
 * One app serves many sites. Every request arrives on a hostname; we map that to a
 * tenant and scope all public reads to it. In dev that's `acme.localhost:3000`; in
 * production a Deftly preview subdomain `acme.deftly.app`, or the customer's own
 * `customDomain` once attached (live session).
 *
 * The pure host parsing (apex/www/subdomain) lives in `./host` so the Payload access
 * layer can reuse it without pulling Next imports into the config graph.
 */

export { extractSubdomain } from './host'

/** Resolve a tenant by its subdomain. Cached per request. */
export const getTenantBySubdomain = cache(async (subdomain: string): Promise<Tenant | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'tenants',
    where: { subdomain: { equals: subdomain.toLowerCase() } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
})

/** Resolve a tenant by an attached custom domain. Cached per request. */
export const getTenantByCustomDomain = cache(async (host: string): Promise<Tenant | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'tenants',
    where: { customDomain: { equals: normaliseHost(host) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ?? null
})

/** Resolve a tenant from any host string (subdomain first, then custom domain). */
export const resolveTenantFromHost = async (host: string | null | undefined): Promise<Tenant | null> => {
  if (!host) return null
  const subdomain = extractSubdomain(host)
  if (subdomain) return getTenantBySubdomain(subdomain)
  return getTenantByCustomDomain(host)
}

/**
 * Is the `x-tenant-subdomain` override honoured? It lets any caller force a tenant, so it
 * must NOT be trusted from arbitrary public traffic in production — a visitor could send
 * it and render another tenant's site under the current host/canonical URL. It is enabled
 * only outside production, or behind an explicit `ALLOW_TENANT_HEADER_OVERRIDE=true` for
 * trusted preview environments.
 */
const tenantHeaderOverrideAllowed =
  process.env.NODE_ENV !== 'production' || process.env.ALLOW_TENANT_HEADER_OVERRIDE === 'true'

/** A tenant is publicly servable unless it has been suspended (churned / disabled). */
const isPubliclyServable = (tenant: Tenant | null): boolean => tenant != null && tenant.status !== 'suspended'

/**
 * The tenant for the current request, from the Host header. Cached so the layout and
 * page resolve it once. A `x-tenant-subdomain` override (dev tooling / tests / trusted
 * preview only) takes precedence. Suspended tenants are never served publicly (treated as
 * unresolved → 404).
 */
export const getRequestTenant = cache(async (): Promise<Tenant | null> => {
  const h = await headers()
  const override = tenantHeaderOverrideAllowed ? h.get('x-tenant-subdomain') : null
  if (override) return getTenantBySubdomain(override) // dev/preview escape hatch: not status-gated
  const host = h.get('host')
  const tenant = await resolveTenantFromHost(host)
  return isPubliclyServable(tenant) ? tenant : null
})

/** The current tenant, or a 404 if the hostname doesn't map to a site. */
export const requireRequestTenant = async (): Promise<Tenant> => {
  const tenant = await getRequestTenant()
  if (!tenant) notFound()
  return tenant
}

/** Absolute base URL for the current request (per-tenant host), for SEO/canonical URLs. */
export const getRequestBaseUrl = cache(async (): Promise<string> => {
  const h = await headers()
  const host = h.get('host')
  if (!host) return process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') || host.includes('.localhost') ? 'http' : 'https')
  return `${proto}://${host}`
})
