import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed, Inter, Open_Sans, Plus_Jakarta_Sans, Poppins } from 'next/font/google'
import React from 'react'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { MobileCallBar } from '@/components/MobileCallBar'
import { getSiteSettings } from '@/lib/queries'
import { getImage } from '@/lib/media'
import { getPreset } from '@/lib/presets'
import { themeVars } from '@/lib/theme'
import { getRequestBaseUrl, requireRequestTenant } from '@/lib/tenant'

import './globals.css'

// next/font is static — every pairing is initialised once at module scope. The
// layout applies ALL of their CSS-variable classes on <html> and then activates the
// right pairing from the `data-font` attribute (see globals.css html[data-font=…]).
// The Reliable (default) pairing:
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-jakarta', display: 'swap' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' })
// Friendly Local pairing (rounded, warm):
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-poppins', display: 'swap' })
const openSans = Open_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-open-sans', display: 'swap' })
// Emergency Red pairing (bold condensed display):
const barlowCondensed = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-barlow-condensed', display: 'swap' })
const barlow = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-barlow', display: 'swap' })

const fontVars = [jakarta, inter, poppins, openSans, barlowCondensed, barlow].map((f) => f.variable).join(' ')

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
      <html lang="en-GB" className={fontVars} data-font="reliable">
        <body>
          <main className="flex-1">{children}</main>
        </body>
      </html>
    )
  }

  const preset = getPreset(settings.designStyle)

  return (
    <html lang="en-GB" className={fontVars} data-font={preset.fontPairing}>
      <body>
        <div
          className="site flex min-h-dvh flex-col pb-[58px] md:pb-0"
          data-preset={preset.designStyle}
          style={themeVars(settings)}
        >
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
