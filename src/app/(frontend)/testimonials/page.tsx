import { getPayload } from '@/lib/payload'
import { Testimonials } from '@/components/sections/Testimonials'

export const dynamic = 'force-dynamic'

export default async function TestimonialsPage() {
  const payload = await getPayload()

  const { docs: testimonials } = await payload.find({
    collection: 'testimonials',
    sort: 'sortOrder',
  })

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
          Testimonials
        </h1>
      </div>
      <Testimonials testimonials={testimonials as unknown as Parameters<typeof Testimonials>[0]['testimonials']} />
    </div>
  )
}
