/**
 * Design presets (Phase 1).
 *
 * A preset is the *design* dimension of a build — how the site looks — and is
 * orthogonal to the trade *template* (which supplies copy, icons and headline
 * generation). The rep picks one in the CRM; it rides the SiteSpec as
 * `story.designStyle` and drives the engine's launch palette, font pairing, hero
 * style, homepage section order and card styling.
 *
 * Everything a preset sets is written onto the tenant's editable SiteSettings /
 * HomePage, so the customer can change any of it (or switch preset entirely) in
 * /admin afterwards — nothing here is hardcoded on the rendered page (Article I).
 */

export type DesignStyle = 'reliable' | 'friendly' | 'emergency'
export const DESIGN_STYLES: DesignStyle[] = ['reliable', 'friendly', 'emergency']

/** Homepage sections; these names key the page-level section registry (page.tsx). */
export type SectionName = 'hero' | 'trust' | 'services' | 'about' | 'testimonials' | 'contact'

/** Hero layout variant (Hero.tsx implements one block per value). */
export type HeroStyle = 'editorial' | 'soft' | 'emergency'

/** Font-pairing key. The layout loads all pairings statically and switches which
 *  CSS-variable set is active by this key (next/font is static — see layout.tsx). */
export type FontPairing = 'reliable' | 'friendly' | 'emergency'

export type Preset = {
  designStyle: DesignStyle
  /** Launch palette, applied only when the rep captured no colour of their own. */
  palette: { brand: string; accent: string }
  fontPairing: FontPairing
  heroStyle: HeroStyle
  /** Which sections render, and in what order, on the homepage. */
  sectionOrder: SectionName[]
  /** Whether the launch build seeds stock hero/about imagery (photo-led looks). */
  seedImagery: boolean
}

const DEFAULT_ORDER: SectionName[] = ['hero', 'trust', 'services', 'about', 'testimonials', 'contact']

export const PRESETS: Record<DesignStyle, Preset> = {
  // The Reliable (default, shipped in Phase 0): calm navy editorial, no photos.
  reliable: {
    designStyle: 'reliable',
    palette: { brand: '#14324f', accent: '#e0620d' },
    fontPairing: 'reliable',
    heroStyle: 'editorial',
    sectionOrder: DEFAULT_ORDER,
    seedImagery: false,
  },
  // Friendly Local: warm teal + amber, softer centred hero, human trust first
  // (About + Testimonials pulled above Services). Like The Reliable it launches on a
  // clean CSS hero rather than a generic stock placeholder (Phase 0 quality stance);
  // the soft hero is built to show a real photo the moment the customer adds one.
  friendly: {
    designStyle: 'friendly',
    palette: { brand: '#1e7a5a', accent: '#f4a300' },
    fontPairing: 'friendly',
    heroStyle: 'soft',
    sectionOrder: ['hero', 'trust', 'about', 'testimonials', 'services', 'contact'],
    seedImagery: false,
  },
  // Emergency Red: near-black + urgent red, oversized call-now hero, urgency first
  // (services + a call/quote band pulled high, About last).
  emergency: {
    designStyle: 'emergency',
    palette: { brand: '#0b1f33', accent: '#e11d2a' },
    fontPairing: 'emergency',
    heroStyle: 'emergency',
    sectionOrder: ['hero', 'trust', 'services', 'contact', 'testimonials', 'about'],
    seedImagery: false,
  },
}

/** Resolve a preset by design style, defaulting to the calm editorial "reliable" look. */
export const getPreset = (designStyle?: string | null): Preset => {
  if (designStyle && designStyle in PRESETS) return PRESETS[designStyle as DesignStyle]
  return PRESETS.reliable
}
