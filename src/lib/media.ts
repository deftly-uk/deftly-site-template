import type { Media } from '@/payload-types'

export type MaybeMedia = number | Media | null | undefined

type ResolvedImage = {
  url: string
  width: number
  height: number
  alt: string
}

/** Returns the populated Media object, or null if it's an unpopulated id / missing. */
export const resolveMedia = (m: MaybeMedia): Media | null =>
  m && typeof m === 'object' ? m : null

const SIZE_FALLBACKS = ['feature', 'card', 'hero', 'thumbnail'] as const

/**
 * Get a usable image src + dimensions from a Media field, preferring a named size.
 * Returns null when there is no image (callers render a graceful fallback) — so a
 * customer deleting a photo never breaks the page.
 */
export const getImage = (
  m: MaybeMedia,
  size?: 'thumbnail' | 'card' | 'feature' | 'hero',
): ResolvedImage | null => {
  const media = resolveMedia(m)
  if (!media?.url) return null

  const alt = media.alt || ''

  if (size && media.sizes?.[size]?.url) {
    const s = media.sizes[size]!
    return {
      url: s.url!,
      width: s.width || media.width || 1200,
      height: s.height || media.height || 800,
      alt,
    }
  }

  // Fall back to the original (always present) so we never return a broken size.
  return {
    url: media.url,
    width: media.width || 1200,
    height: media.height || 800,
    alt,
  }
}
