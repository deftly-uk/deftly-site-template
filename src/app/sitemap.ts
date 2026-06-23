import type { MetadataRoute } from 'next'

import { SERVER_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SERVER_URL}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${SERVER_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
