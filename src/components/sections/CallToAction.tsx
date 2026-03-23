import React from 'react'
import Link from 'next/link'

interface CallToActionProps {
  settings: {
    ctaHeading?: string | null
    ctaText?: string | null
    ctaButtonText?: string | null
    ctaButtonLink?: string | null
  }
}

export function CallToAction({ settings }: CallToActionProps) {
  const { ctaHeading, ctaText, ctaButtonText, ctaButtonLink } = settings

  if (!ctaHeading && !ctaText) return null

  return (
    <section className="bg-gray-900 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {ctaHeading || 'Ready to Get Started?'}
        </h2>
        {ctaText && (
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-300">
            {ctaText}
          </p>
        )}
        {ctaButtonText && ctaButtonLink && (
          <Link
            href={ctaButtonLink}
            className="mt-8 inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
          >
            {ctaButtonText}
          </Link>
        )}
      </div>
    </section>
  )
}
