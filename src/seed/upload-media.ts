import { existsSync, readFileSync } from 'node:fs'
import { join, basename } from 'node:path'
import type { Payload } from 'payload'

/**
 * Upload an image file to the Media collection.
 * Returns the created media document (with id and url).
 *
 * Idempotent: if a media item with the same filename already exists, returns it.
 */
export async function uploadMedia(
  payload: Payload,
  filename: string,
  alt: string,
  searchDirs: string[] = ['public/uploads', 'raw-images'],
): Promise<{ id: number | string; url?: string } | null> {
  // Check if already uploaded (by filename)
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: basename(filename) } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    const doc = existing.docs[0] as { id: number | string; url?: string }
    console.log(`  [skip] Media already exists: ${filename} (id: ${doc.id})`)
    return doc
  }

  // Find the file on disk
  let filePath: string | null = null
  for (const dir of searchDirs) {
    const candidate = join(process.cwd(), dir, filename)
    if (existsSync(candidate)) {
      filePath = candidate
      break
    }
  }

  if (!filePath) {
    console.warn(`  [warn] Image not found: ${filename} (searched: ${searchDirs.join(', ')})`)
    return null
  }

  const fileBuffer = readFileSync(filePath)
  const mimeType = filename.endsWith('.png')
    ? 'image/png'
    : filename.endsWith('.webp')
      ? 'image/webp'
      : filename.endsWith('.gif')
        ? 'image/gif'
        : 'image/jpeg'

  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data: fileBuffer,
      name: basename(filename),
      mimetype: mimeType,
      size: fileBuffer.length,
    },
  })

  console.log(`  [ok] Uploaded: ${filename} (id: ${doc.id})`)
  return { id: doc.id, url: (doc as Record<string, unknown>).url as string | undefined }
}
