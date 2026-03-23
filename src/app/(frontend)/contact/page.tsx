import { getPayload } from '@/lib/payload'
import { Contact } from '@/components/sections/Contact'

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const payload = await getPayload()

  let settings: Record<string, unknown> = {}
  try {
    settings = await payload.findGlobal({ slug: 'site-settings' }) as Record<string, unknown>
  } catch {
    // Settings not yet seeded
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
          Contact
        </h1>
      </div>
      <Contact settings={settings as Parameters<typeof Contact>[0]['settings']} />
    </div>
  )
}
