import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import React from 'react'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { MobileCallBar } from '@/components/MobileCallBar'
import { getSiteSettings } from '@/lib/queries'
import { getImage } from '@/lib/media'
import { themeVars } from '@/lib/theme'
import { getRequestBaseUrl, requireRequestTenant } from '@/lib/tenant'

import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

/** Site-wide metadata defaults from the current tenant's CMS content. */
export const generateMetadata = async (): Promise<Metadata> => {
  const tenant = await requireRequestTenant()
  const [settings, baseUrl] = await Promise.all([getSiteSettings(tenant.id), getRequestBaseUrl()])
  if (!settings) return {}
  const logo = getImage(settings.logo, 'thumbnail')
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: [settings.businessName, settings.tagline].filter(Boolean).join(' — '),
      template: `%s · ${settings.businessName}`,
    },
    description: settings.defaultMetaDescription || settings.tagline || undefined,
    robots: { index: true, follow: true },
    icons: logo ? { icon: logo.url } : undefined,
  }
}

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  // Resolve the tenant from the hostname; a hostname with no site is a 404.
  const tenant = await requireRequestTenant()
  const settings = await getSiteSettings(tenant.id)
  if (!settings) {
    // Tenant exists but has no content yet (e.g. mid-build). Render a minimal shell.
    return (
      <html lang="en-GB" className={`${jakarta.variable} ${inter.variable}`}>
        <body>
          <main className="flex-1">{children}</main>
        </body>
      </html>
    )
  }

  return (
    <html lang="en-GB" className={`${jakarta.variable} ${inter.variable}`}>
      <body>
        <div className="site flex min-h-dvh flex-col pb-[58px] md:pb-0" style={themeVars(settings)}>
          <Header settings={settings} />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} />
        </div>
        <MobileCallBar settings={settings} />
      </body>
    </html>
  )
}

export default RootLayout
