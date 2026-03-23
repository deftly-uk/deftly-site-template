import React from 'react'
import Image from 'next/image'

interface HeroProps {
  settings: {
    heroHeading?: string | null
    heroSubheading?: string | null
    heroImage?: { url?: string; alt?: string } | null
    businessName?: string | null
  }
}

export function Hero({ settings }: HeroProps) {
  const { heroHeading, heroSubheading, heroImage, businessName } = settings

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
      {heroImage?.url ? (
        <Image
          src={heroImage.url}
          alt={heroImage.alt || heroHeading || 'Hero image'}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gray-900" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/30" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {heroHeading || businessName || 'Welcome'}
        </h1>
        {heroSubheading && (
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">
            {heroSubheading}
          </p>
        )}
      </div>
    </section>
  )
}
