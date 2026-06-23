import type { Metadata } from 'next'
import React from 'react'

import { RichText } from '@/components/RichText'
import { getSiteSettings } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export const generateMetadata = async (): Promise<Metadata> => ({
  title: 'Privacy Policy',
  robots: { index: true, follow: true },
})

const PrivacyPage = async () => {
  const settings = await getSiteSettings()

  return (
    <section className="section bg-white">
      <div className="container-x max-w-3xl">
        <h1 className="text-4xl font-extrabold">Privacy Policy</h1>
        {settings.privacyPolicy ? (
          <RichText data={settings.privacyPolicy} className="prose-cms mt-8 text-lg" />
        ) : (
          <p className="mt-6 text-[color:var(--color-body)]">
            Our privacy policy will be published here shortly. In the meantime, contact us with
            any questions about how we handle your data.
          </p>
        )}
      </div>
    </section>
  )
}

export default PrivacyPage
