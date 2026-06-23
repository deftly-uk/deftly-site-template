import sharp from 'sharp'
import type { Payload } from 'payload'

/**
 * Seed imagery. Per the Constitution, real client photos beat everything and we
 * "generate only as placeholder" — so the seed produces clean, on-brand gradient
 * images and uploads them to Vercel Blob (Article III: never to git). The customer
 * swaps these for their own photos in the admin panel.
 */

export type SeedImageSpec = {
  key: string
  filename: string
  alt: string
  width: number
  height: number
  variant: 'hero' | 'about' | 'og'
}

const diagonalLines = (w: number, h: number): string => {
  const lines: string[] = []
  for (let x = -h; x < w; x += 64) {
    lines.push(`<line x1="${x}" y1="0" x2="${x + h}" y2="${h}" />`)
  }
  return `<g stroke="#ffffff" stroke-opacity="0.045" stroke-width="2">${lines.join('')}</g>`
}

const svgFor = (spec: SeedImageSpec): string => {
  const { width: w, height: h, variant } = spec
  const stops =
    variant === 'about'
      ? ['#1d4972', '#173a5e', '#0f2c47']
      : ['#0c2238', '#173a5e', '#25507f']
  const glow =
    variant === 'about'
      ? '<stop offset="0" stop-color="#e0620d" stop-opacity="0.18"/><stop offset="1" stop-color="#000" stop-opacity="0"/>'
      : '<stop offset="0" stop-color="#3a7bb8" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/>'
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${stops[0]}"/>
        <stop offset="0.55" stop-color="${stops[1]}"/>
        <stop offset="1" stop-color="${stops[2]}"/>
      </linearGradient>
      <radialGradient id="r" cx="0.72" cy="0.22" r="0.9">${glow}</radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    ${diagonalLines(w, h)}
    <rect width="${w}" height="${h}" fill="url(#r)"/>
  </svg>`
}

const renderJpeg = (spec: SeedImageSpec): Promise<Buffer> =>
  sharp(Buffer.from(svgFor(spec)))
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer()

/** Create the media doc if it doesn't already exist (idempotent by filename). */
export const upsertImage = async (payload: Payload, spec: SeedImageSpec): Promise<number> => {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: spec.filename } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return existing.docs[0].id as number

  const data = await renderJpeg(spec)
  const created = await payload.create({
    collection: 'media',
    data: { alt: spec.alt },
    file: {
      data,
      mimetype: 'image/jpeg',
      name: spec.filename,
      size: data.length,
    },
  })
  return created.id as number
}
