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

/** WCAG relative luminance of a hex colour. */
const luminance = (hex: string): number => {
  const h = normalize(hex)
  if (!h) return 1
  const num = parseInt(h.slice(1), 16)
  const chan = [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2]
}

const contrastWithWhite = (hex: string): number => 1.05 / (luminance(hex) + 0.05)

/** Darken a colour until white text on it clears the AA ratio (default 4.5:1). */
const ensureContrastOnWhite = (hex: string, target = 4.5): string => {
  let c = normalize(hex)
  if (!c) return hex
  let guard = 0
  while (contrastWithWhite(c) < target && guard < 24) {
    c = shade(c, -8)
    guard++
  }
  return c
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
    // Keep white-on-accent buttons + accent text accessible whatever colour is chosen.
    const strong = ensureContrastOnWhite(accent, 4.5)
    vars['--color-accent-strong'] = strong
    vars['--color-accent-dark'] = shade(strong, -22)
  }
  return vars as CSSProperties
}
