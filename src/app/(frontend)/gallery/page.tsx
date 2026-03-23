import { getPayload } from '@/lib/payload'
import { Gallery } from '@/components/sections/Gallery'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const payload = await getPayload()

  const { docs: gallery } = await payload.find({
    collection: 'gallery',
    sort: 'sortOrder',
  })

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
          Gallery
        </h1>
      </div>
      <Gallery items={gallery as unknown as Parameters<typeof Gallery>[0]['items']} />
    </div>
  )
}
