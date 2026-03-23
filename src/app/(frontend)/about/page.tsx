import { getPayload } from '@/lib/payload'
import { About } from '@/components/sections/About'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const payload = await getPayload()

  let settings: Record<string, unknown> = {}
  try {
    settings = await payload.findGlobal({ slug: 'site-settings' }) as Record<string, unknown>
  } catch {
    // Settings not yet seeded
  }

  return (
    <About settings={settings as Parameters<typeof About>[0]['settings']} />
  )
}
