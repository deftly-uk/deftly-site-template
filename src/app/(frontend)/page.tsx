import { getPayload } from '@/lib/payload'
import { Hero } from '@/components/sections/Hero'
import { Services } from '@/components/sections/Services'
import { About } from '@/components/sections/About'
import { Testimonials } from '@/components/sections/Testimonials'
import { Gallery } from '@/components/sections/Gallery'
import { CallToAction } from '@/components/sections/CallToAction'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload()

  let settings: Record<string, unknown> = {}
  try {
    settings = await payload.findGlobal({ slug: 'site-settings' }) as Record<string, unknown>
  } catch {
    // Settings not yet seeded
  }

  const { docs: services } = await payload.find({
    collection: 'services',
    limit: 6,
    sort: 'sortOrder',
  })

  const { docs: testimonials } = await payload.find({
    collection: 'testimonials',
    limit: 4,
    sort: 'sortOrder',
  })

  const { docs: gallery } = await payload.find({
    collection: 'gallery',
    limit: 6,
    sort: 'sortOrder',
  })

  return (
    <>
      <Hero settings={settings as Parameters<typeof Hero>[0]['settings']} />
      <Services services={services as unknown as Parameters<typeof Services>[0]['services']} />
      <About settings={settings as Parameters<typeof About>[0]['settings']} />
      <Testimonials testimonials={testimonials as unknown as Parameters<typeof Testimonials>[0]['testimonials']} />
      <Gallery items={gallery as unknown as Parameters<typeof Gallery>[0]['items']} />
      <CallToAction settings={settings as Parameters<typeof CallToAction>[0]['settings']} />
    </>
  )
}
