import type { CSSProperties } from 'react'

import type { SiteSetting } from '@/payload-types'

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

const normalize = (hex: string): string | null => {
  if (!HEX.test(hex)) return null
  let h = hex.slice(1)
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return `#${h.toLowerCase()}`
}

/** Mix a hex colour toward black (percent < 0) or white (percent > 0). */
const shade = (hex: string, percent: number): string => {
  const h = normalize(hex)
  if (!h) return hex
  const num = parseInt(h.slice(1), 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  const t = percent < 0 ? 0 : 255
  const p = Math.abs(percent) / 100
  const mix = (c: number) => Math.round((t - c) * p + c)
  const to2 = (c: number) => c.toString(16).padStart(2, '0')
  return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`
}

/**
 * CSS custom properties derived from the CMS brand/accent colours.
 * Applied on the .site wrapper so a customer changing their colours in the admin
 * panel re-themes the whole site (Article I) — with sensible navy/orange defaults
 * baked into globals.css when these are left blank.
 */
export const themeVars = (
  settings: Pick<SiteSetting, 'brandColor' | 'accentColor'>,
): CSSProperties => {
  const vars: Record<string, string> = {}
  const brand = settings.brandColor ? normalize(settings.brandColor) : null
  const accent = settings.accentColor ? normalize(settings.accentColor) : null

  if (brand) {
    vars['--color-brand'] = brand
    vars['--color-brand-dark'] = shade(brand, -42)
    vars['--color-brand-light'] = shade(brand, 16)
  }
  if (accent) {
    vars['--color-accent'] = accent
    vars['--color-accent-dark'] = shade(accent, -18)
  }
  return vars as CSSProperties
}
