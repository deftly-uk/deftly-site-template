import Link from 'next/link'
import React from 'react'

import { getSiteSettings } from '@/lib/queries'

export const dynamic = 'force-dynamic'

const NotFound = async () => {
  const settings = await getSiteSettings()
  const nf = settings.notFound

  return (
    <section className="section bg-white">
      <div className="container-x mx-auto max-w-lg text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-4xl font-extrabold">{nf?.heading || 'Page not found'}</h1>
        <p className="mt-4 text-[color:var(--color-body)]">
          {nf?.body || 'Sorry, we couldn’t find the page you were looking for.'}
        </p>
        <Link href="/" className="btn btn-accent mt-8">
          {nf?.backLabel || 'Back to home'}
        </Link>
      </div>
    </section>
  )
}

export default NotFound
