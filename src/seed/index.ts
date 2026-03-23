/**
 * Seed script — populates the CMS from site-content.json
 *
 * Usage:
 *   npx tsx src/seed/index.ts
 *   npx tsx src/seed/index.ts --environment production
 *
 * Requirements (from Bracken + Wilding deployment lessons):
 * - Idempotent: upsert pattern, running twice doesn't create duplicates
 * - Targets production by default
 * - Uploads images to Media collection (→ Vercel Blob)
 * - Logs what it does
 */

import { readFileSync, existsSync } from 'node:fs'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'
import path from 'path'
import { uploadMedia } from './upload-media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
const envFlag = args.includes('--environment')
  ? args[args.indexOf('--environment') + 1]
  : 'production'

console.log(`\nSeed script — environment: ${envFlag}\n`)

// ---------------------------------------------------------------------------
// Load site-content.json
// ---------------------------------------------------------------------------
const contentPath = path.resolve(process.cwd(), 'site-content.json')

if (!existsSync(contentPath)) {
  console.error('Error: site-content.json not found in project root.')
  console.error('Create it with your business content before running seed.')
  process.exit(1)
}

interface SiteContent {
  settings?: Record<string, unknown>
  services?: Array<Record<string, unknown>>
  testimonials?: Array<Record<string, unknown>>
  gallery?: Array<Record<string, unknown>>
  images?: Record<string, string>
}

const content: SiteContent = JSON.parse(readFileSync(contentPath, 'utf-8'))
const stats = { media: 0, services: 0, testimonials: 0, gallery: 0 }

// ---------------------------------------------------------------------------
// Init Payload
// ---------------------------------------------------------------------------
const configPath = path.resolve(dirname, '..', 'payload.config.ts')
const configModule = await import(configPath)
const payload = await getPayload({ config: configModule.default })

// ---------------------------------------------------------------------------
// Step 1: Upload images
// ---------------------------------------------------------------------------
console.log('▸ Uploading images...')

const mediaMap: Record<string, { id: number | string; url?: string }> = {}

// Upload named images (hero, logo, about)
if (content.images) {
  for (const [key, filename] of Object.entries(content.images)) {
    if (!filename) continue
    const result = await uploadMedia(payload, filename, key)
    if (result) {
      mediaMap[key] = result
      stats.media++
    }
  }
}

// Upload service images
if (content.services) {
  for (const service of content.services) {
    const img = service.image as string | undefined
    if (img) {
      const result = await uploadMedia(payload, img, (service.title as string) || 'Service')
      if (result) {
        mediaMap[`service:${img}`] = result
        stats.media++
      }
    }
  }
}

// Upload gallery images
if (content.gallery) {
  for (const item of content.gallery) {
    const img = item.image as string | undefined
    if (img) {
      const result = await uploadMedia(payload, img, (item.title as string) || 'Gallery')
      if (result) {
        mediaMap[`gallery:${img}`] = result
        stats.media++
      }
    }
  }
}

// Upload testimonial images
if (content.testimonials) {
  for (const item of content.testimonials) {
    const img = item.image as string | undefined
    if (img) {
      const result = await uploadMedia(payload, img, (item.name as string) || 'Testimonial')
      if (result) {
        mediaMap[`testimonial:${img}`] = result
        stats.media++
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Step 2: Update SiteSettings global
// ---------------------------------------------------------------------------
console.log('\n▸ Updating SiteSettings...')

if (content.settings) {
  const settingsData: Record<string, unknown> = { ...content.settings }

  // Resolve image references to media IDs
  if (mediaMap.hero) settingsData.heroImage = mediaMap.hero.id
  if (mediaMap.logo) settingsData.logo = mediaMap.logo.id
  if (mediaMap.about) settingsData.aboutImage = mediaMap.about.id

  // Handle richText fields — convert plain strings to Lexical format
  if (typeof settingsData.aboutText === 'string') {
    settingsData.aboutText = stringToLexical(settingsData.aboutText as string)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    data: settingsData,
  })

  console.log('  [ok] SiteSettings updated')
}

// ---------------------------------------------------------------------------
// Step 3: Upsert Services
// ---------------------------------------------------------------------------
console.log('\n▸ Seeding services...')

if (content.services) {
  for (let i = 0; i < content.services.length; i++) {
    const service = content.services[i]
    const title = service.title as string

    // Check for existing by title (upsert)
    const existing = await payload.find({
      collection: 'services',
      where: { title: { equals: title } },
      limit: 1,
    })

    const data: Record<string, unknown> = {
      title,
      sortOrder: service.sortOrder ?? i,
    }

    if (typeof service.description === 'string') {
      data.description = stringToLexical(service.description)
    } else if (service.description) {
      data.description = service.description
    }

    const imgKey = `service:${service.image}`
    if (mediaMap[imgKey]) {
      data.image = mediaMap[imgKey].id
    }

    if (service.icon) data.icon = service.icon

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'services',
        id: existing.docs[0].id,
        data,
      })
      console.log(`  [update] ${title}`)
    } else {
      await payload.create({
        collection: 'services',
        data,
      })
      console.log(`  [create] ${title}`)
    }
    stats.services++
  }
}

// ---------------------------------------------------------------------------
// Step 4: Upsert Testimonials
// ---------------------------------------------------------------------------
console.log('\n▸ Seeding testimonials...')

if (content.testimonials) {
  for (let i = 0; i < content.testimonials.length; i++) {
    const testimonial = content.testimonials[i]
    const name = testimonial.name as string

    const existing = await payload.find({
      collection: 'testimonials',
      where: { name: { equals: name } },
      limit: 1,
    })

    const data: Record<string, unknown> = {
      name,
      quote: testimonial.quote,
      sortOrder: testimonial.sortOrder ?? i,
    }

    if (testimonial.role) data.role = testimonial.role
    if (testimonial.rating) data.rating = testimonial.rating

    const imgKey = `testimonial:${testimonial.image}`
    if (mediaMap[imgKey]) {
      data.image = mediaMap[imgKey].id
    }

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'testimonials',
        id: existing.docs[0].id,
        data,
      })
      console.log(`  [update] ${name}`)
    } else {
      await payload.create({
        collection: 'testimonials',
        data,
      })
      console.log(`  [create] ${name}`)
    }
    stats.testimonials++
  }
}

// ---------------------------------------------------------------------------
// Step 5: Upsert Gallery
// ---------------------------------------------------------------------------
console.log('\n▸ Seeding gallery...')

if (content.gallery) {
  for (let i = 0; i < content.gallery.length; i++) {
    const item = content.gallery[i]
    const title = (item.title as string) || `Gallery ${i + 1}`

    const existing = await payload.find({
      collection: 'gallery',
      where: { title: { equals: title } },
      limit: 1,
    })

    const data: Record<string, unknown> = {
      title,
      sortOrder: item.sortOrder ?? i,
    }

    if (item.category) data.category = item.category
    if (item.description) data.description = item.description

    const imgKey = `gallery:${item.image}`
    if (mediaMap[imgKey]) {
      data.image = mediaMap[imgKey].id
    }

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'gallery',
        id: existing.docs[0].id,
        data,
      })
      console.log(`  [update] ${title}`)
    } else {
      await payload.create({
        collection: 'gallery',
        data,
      })
      console.log(`  [create] ${title}`)
    }
    stats.gallery++
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`
---
Seed complete.
  Media uploaded: ${stats.media}
  Services: ${stats.services}
  Testimonials: ${stats.testimonials}
  Gallery: ${stats.gallery}
`)

process.exit(0)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a plain string to Payload's Lexical richText format.
 * Splits on double-newlines to create paragraphs.
 */
function stringToLexical(text: string) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  return {
    root: {
      type: 'root',
      children: paragraphs.map((p) => ({
        type: 'paragraph',
        children: [{ type: 'text', text: p.trim(), version: 1 }],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      })),
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}
