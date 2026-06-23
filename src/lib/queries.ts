import { cache } from 'react'

import type { HomePage, Service, SiteSetting, Testimonial } from '@/payload-types'

import { getPayloadClient } from './payload'

/**
 * Central content fetchers. Every customer-visible value on the site comes
 * through one of these — there is no hardcoded copy anywhere (Article I).
 * depth: 2 populates uploads (logo, hero/about/service images) as full Media objects.
 * Wrapped in React cache() so the layout and page share one query per request.
 */

export const getSiteSettings = cache(async (): Promise<SiteSetting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 2 })
})

export const getHomePage = cache(async (): Promise<HomePage> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'home-page', depth: 2 })
})

export const getServices = cache(async (): Promise<Service[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'services',
    depth: 2,
    limit: 100,
    sort: 'order',
  })
  return docs
})

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'testimonials',
    depth: 1,
    limit: 50,
    sort: 'order',
  })
  return docs
})
