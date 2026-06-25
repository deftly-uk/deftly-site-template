import sharp from 'sharp'
import type { Payload } from 'payload'

/**
 * Stock imagery (Constitution Article I/III: real client photos beat everything; we
 * "generate only as placeholder"). Produces clean, on-brand gradient images so a site
 * launches looking finished before the customer's real photos arrive. The palette is
 * industry-aware so a plumber and an electrician don't look identical.
 *
 * Tenant-scoped: each generated image is tagged to its tenant and stored under that
 * tenant's storage prefix, and the filename is namespaced so two tenants never collide.
 */

export type StockVariant = 'hero' | 'about' | 'og'
export type StockPalette = 'plumber' | 'electrician' | 'roofer' | 'other'

type Stops = { base: [string, string, string]; aboutGlow: string; heroGlow: string }

const PALETTES: Record<StockPalette, Stops> = {
  plumber: {
    base: ['#0c2238', '#173a5e', '#25507f'],
    aboutGlow: '#e0620d',
    heroGlow: '#3a7bb8',
  },
  electrician: {
    base: ['#1a1505', '#3a2e0a', '#5c4a12'],
    aboutGlow: '#f5b301',
    heroGlow: '#d99a16',
  },
  roofer: {
    base: ['#1c1413', '#3a2723', '#5a3b34'],
    aboutGlow: '#c2562e',
    heroGlow: '#9c5b46',
  },
  other: {
    base: ['#101826', '#1f2c43', '#314563'],
    aboutGlow: '#3a7bb8',
    heroGlow: '#5b8fc4',
  },
}

export type StockImageSpec = {
  filename: string
  alt: string
  width: number
  height: number
  variant: StockVariant
  palette?: StockPalette
}

const diagonalLines = (w: number, h: number): string => {
  const lines: string[] = []
  for (let x = -h; x < w; x += 64) {
    lines.push(`<line x1="${x}" y1="0" x2="${x + h}" y2="${h}" />`)
  }
  return `<g stroke="#ffffff" stroke-opacity="0.045" stroke-width="2">${lines.join('')}</g>`
}

const svgFor = (spec: StockImageSpec): string => {
  const { width: w, height: h, variant } = spec
  const pal = PALETTES[spec.palette ?? 'plumber']
  const stops = pal.base
  const glowColor = variant === 'about' ? pal.aboutGlow : pal.heroGlow
  const glowOpacity = variant === 'about' ? '0.18' : '0.5'
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${stops[0]}"/>
        <stop offset="0.55" stop-color="${stops[1]}"/>
        <stop offset="1" stop-color="${stops[2]}"/>
      </linearGradient>
      <radialGradient id="r" cx="0.72" cy="0.22" r="0.9">
        <stop offset="0" stop-color="${glowColor}" stop-opacity="${glowOpacity}"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    ${diagonalLines(w, h)}
    <rect width="${w}" height="${h}" fill="url(#r)"/>
  </svg>`
}

const renderJpeg = (spec: StockImageSpec): Promise<Buffer> =>
  sharp(Buffer.from(svgFor(spec)))
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer()

/**
 * Create a tenant-scoped placeholder image if it doesn't already exist (idempotent by
 * tenant + filename). Returns the media id. The `tenant` field drives the per-tenant
 * storage prefix and the access scoping.
 */
export const upsertTenantImage = async (
  payload: Payload,
  tenantId: number,
  spec: StockImageSpec,
): Promise<number> => {
  const existing = await payload.find({
    collection: 'media',
    where: { and: [{ filename: { equals: spec.filename } }, { tenant: { equals: tenantId } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs[0]) return existing.docs[0].id as number

  const data = await renderJpeg(spec)
  const created = await payload.create({
    collection: 'media',
    data: { alt: spec.alt, tenant: tenantId },
    file: { data, mimetype: 'image/jpeg', name: spec.filename, size: data.length },
    overrideAccess: true,
  })
  return created.id as number
}
