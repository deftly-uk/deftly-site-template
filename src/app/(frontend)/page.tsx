import type { Metadata } from 'next'
import React from 'react'

import { JsonLd } from '@/components/JsonLd'
import { About } from '@/components/sections/About'
import { ContactCTA } from '@/components/sections/ContactCTA'
import { Hero } from '@/components/sections/Hero'
import { Services } from '@/components/sections/Services'
import { Testimonials } from '@/components/sections/Testimonials'
import { TrustStrip } from '@/components/sections/TrustStrip'
import { getHomePage, getServices, getSiteSettings, getTestimonials } from '@/lib/queries'
import { buildHomeMetadata, buildLocalBusinessJsonLd } from '@/lib/seo'

// Every section is read from the CMS at request time, so an edit in the admin
// panel shows on the next page load (Constitution Article I & II).
export const dynamic = 'force-dynamic'

export const generateMetadata = async (): Promise<Metadata> => {
  const [settings, home] = await Promise.all([getSiteSettings(), getHomePage()])
  return buildHomeMetadata(settings, home)
}

const Home = async () => {
  const [settings, home, services, testimonials] = await Promise.all([
    getSiteSettings(),
    getHomePage(),
    getServices(),
    getTestimonials(),
  ])

  return (
    <>
      <JsonLd data={buildLocalBusinessJsonLd(settings)} />
      <Hero home={home} settings={settings} />
      <TrustStrip home={home} settings={settings} />
      <Services home={home} services={services} />
      <About home={home} />
      <Testimonials home={home} testimonials={testimonials} />
      <ContactCTA home={home} settings={settings} />
    </>
  )
}

export default Home
