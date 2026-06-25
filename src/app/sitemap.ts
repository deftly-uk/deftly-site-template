import type { MetadataRoute } from 'next'

import { getRequestBaseUrl } from '@/lib/tenant'

// Per-request so each tenant's hostname lists its own URLs.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getRequestBaseUrl()
  return [
    { url: `${baseUrl}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
