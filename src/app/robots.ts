import type { MetadataRoute } from 'next'

import { getRequestBaseUrl } from '@/lib/tenant'

// Per-request so each tenant's hostname advertises its own sitemap.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getRequestBaseUrl()
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
