import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { JsonLd } from '@/components/JsonLd'
import { About } from '@/components/sections/About'
import { ContactCTA } from '@/components/sections/ContactCTA'
import { Hero } from '@/components/sections/Hero'
import { Services } from '@/components/sections/Services'
import { Testimonials } from '@/components/sections/Testimonials'
import { TrustStrip } from '@/components/sections/TrustStrip'
import { getHomePage, getServices, getSiteSettings, getTestimonials } from '@/lib/queries'
import { getPreset, type SectionName } from '@/lib/presets'
import { buildHomeMetadata, buildLocalBusinessJsonLd } from '@/lib/seo'
import { getRequestBaseUrl, requireRequestTenant } from '@/lib/tenant'

// Every section is read from the CMS at request time, scoped to the tenant resolved
// from the hostname, so an edit in one tenant's admin shows on the next load of that
// tenant's site only (Constitution Article I & II, now per-tenant).
export const dynamic = 'force-dynamic'

export const generateMetadata = async (): Promise<Metadata> => {
  const tenant = await requireRequestTenant()
  const [settings, home, baseUrl] = await Promise.all([
    getSiteSettings(tenant.id),
    getHomePage(tenant.id),
    getRequestBaseUrl(),
  ])
  if (!settings || !home) return {}
  return buildHomeMetadata(settings, home, baseUrl)
}

const Home = async () => {
  const tenant = await requireRequestTenant()
  const [settings, home, services, testimonials, baseUrl] = await Promise.all([
    getSiteSettings(tenant.id),
    getHomePage(tenant.id),
    getServices(tenant.id),
    getTestimonials(tenant.id),
    getRequestBaseUrl(),
  ])

  // Tenant resolved but not yet populated (e.g. queued/building) — treat as not found.
  if (!settings || !home) notFound()

  // The design preset decides which sections render and in what order (and the hero
  // style). A section registry keeps the render declarative; unknown names are skipped.
  const preset = getPreset(settings.designStyle)
  const sections: Record<SectionName, React.ReactNode> = {
    hero: <Hero key="hero" home={home} settings={settings} variant={preset.heroStyle} />,
    trust: <TrustStrip key="trust" home={home} settings={settings} />,
    services: <Services key="services" home={home} services={services} />,
    about: <About key="about" home={home} />,
    testimonials: <Testimonials key="testimonials" home={home} testimonials={testimonials} />,
    contact: <ContactCTA key="contact" home={home} settings={settings} />,
  }

  return (
    <>
      <JsonLd data={buildLocalBusinessJsonLd(settings, baseUrl)} />
      {preset.sectionOrder.map((name) => sections[name]).filter(Boolean)}
    </>
  )
}

export default Home
