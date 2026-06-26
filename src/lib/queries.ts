import { cache } from 'react'

import type { HomePage, Service, SiteSetting, Testimonial } from '@/payload-types'

import { getPayloadClient } from './payload'

/**
 * Central content fetchers — every customer-visible value comes through one of these
 * (Article I: no hardcoded copy). Each read is scoped to ONE tenant, so a request on
 * tenant A's hostname can only ever surface tenant A's content. The tenant id comes
 * from hostname resolution (src/lib/tenant.ts).
 *
 * SiteSettings + HomePage are per-tenant "globals" (one row per tenant) implemented as
 * collections, so they are read with a tenant-filtered find. depth: 2 populates uploads
 * (logo, hero/about/service images) as full Media objects. Wrapped in React cache() so
 * the layout and page share one query per tenant per request.
 */

type TenantId = number | string

export const getSiteSettings = cache(async (tenantId: TenantId): Promise<SiteSetting | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'site-settings',
    where: { tenant: { equals: tenantId } },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })
  return docs[0] ?? null
})

export const getHomePage = cache(async (tenantId: TenantId): Promise<HomePage | null> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'home-page',
    where: { tenant: { equals: tenantId } },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })
  return docs[0] ?? null
})

export const getServices = cache(async (tenantId: TenantId): Promise<Service[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'services',
    where: { tenant: { equals: tenantId } },
    depth: 2,
    limit: 100,
    sort: 'order',
    overrideAccess: true,
  })
  return docs
})

export const getTestimonials = cache(async (tenantId: TenantId): Promise<Testimonial[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'testimonials',
    where: { tenant: { equals: tenantId } },
    depth: 1,
    limit: 50,
    sort: 'order',
    overrideAccess: true,
  })
  return docs
})
