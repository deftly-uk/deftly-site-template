import { getPayload } from '@/lib/payload'
import { Services } from '@/components/sections/Services'

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  const payload = await getPayload()

  const { docs: services } = await payload.find({
    collection: 'services',
    sort: 'sortOrder',
  })

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
          Services
        </h1>
      </div>
      <Services services={services as unknown as Parameters<typeof Services>[0]['services']} />
    </div>
  )
}
