import React from 'react'
import './globals.css'
import { getPayload } from '@/lib/payload'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Welcome',
  description: 'A website built with Deftly',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const payload = await getPayload()
  let settings: Record<string, unknown> = {}

  try {
    settings = await payload.findGlobal({ slug: 'site-settings' }) as Record<string, unknown>
  } catch {
    // Settings not yet seeded — use empty defaults
  }

  const businessName = settings.businessName as string | undefined

  return (
    <html lang="en">
      <head>
        {businessName && <title>{businessName}</title>}
      </head>
      <body className="flex min-h-screen flex-col">
        <Header settings={settings as Parameters<typeof Header>[0]['settings']} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings as Parameters<typeof Footer>[0]['settings']} />
      </body>
    </html>
  )
}
