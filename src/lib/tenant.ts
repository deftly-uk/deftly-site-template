import { cache } from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import type { Tenant } from '@/payload-types'

import { getPayloadClient } from './payload'

/**
 * Hostname → tenant resolution (Stage 1).
 *
 * One app serves many sites. Every request arrives on a hostname; we map that to a
 * tenant and scope all public reads to it. In dev that's `acme.localhost:3000`; in
 * production a Deftly preview subdomain `acme.deftly.app`, or the customer's own
 * `customDomain` once attached (live session).
 *
 * `ROOT_DOMAIN` (default `localhost`) is the apex the subdomains hang off; the first
 * label of `<sub>.<ROOT_DOMAIN>` is the tenant subdomain. A bare apex, `www`, or a
 * dev override (`?tenant=` / `x-tenant-subdomain` header) are handled too.
 */

const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || 'localhost').toLowerCase()

/** Strip the port and lowercase a Host header value. */
const normaliseHost = (host: string): string => host.split(':')[0]!.trim().toLowerCase()

/**
 * Extract the tenant subdomain from a host, or null if this is the apex / unknown.
 * Pure + synchronous so it is trivial to unit-test.
 */
export const extractSubdomain = (rawHost: string | null | undefined): string | null => {
  if (!rawHost) return null
  const host = normaliseHost(rawHost)
  if (!host || host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return null

  // <sub>.<ROOT_DOMAIN> → sub (supports nested labels in custom roots).
  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = host.slice(0, -(ROOT_DOMAIN.length + 1))
    const first = sub.split('.')[0]!
    return first === 'www' || first === '' ? null : first
  }

  // Not under the configured root: treat as a custom domain (resolved separately).
  return null
}

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
 * The tenant for the current request, from the Host header. Cached so the layout and
 * page resolve it once. A `x-tenant-subdomain` header or `host` override (set by dev
 * tooling / tests) takes precedence, making local multi-tenant testing painless.
 */
export const getRequestTenant = cache(async (): Promise<Tenant | null> => {
  const h = await headers()
  const override = h.get('x-tenant-subdomain')
  if (override) return getTenantBySubdomain(override)
  const host = h.get('host')
  return resolveTenantFromHost(host)
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
