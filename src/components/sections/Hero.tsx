import Image from 'next/image'
import React from 'react'

import type { HomePage, SiteSetting } from '@/payload-types'
import { getImage } from '@/lib/media'
import { telHref } from '@/lib/format'
import { Stars } from '@/components/Stars'
import { CheckIcon, PhoneIcon, ShieldCheckIcon } from '@/components/icons'

type Props = { home: HomePage; settings: SiteSetting }

/** Hero — answers "who/what/where + reassurance" in one screen, with call + quote CTAs. */
export const Hero: React.FC<Props> = ({ home, settings }) => {
  const image = getImage(home.heroImage, 'hero')
  const tel = telHref(settings.phone)
  const primaryLabel = home.heroPrimaryCtaLabel || 'Call now'
  const secondaryLabel = home.heroSecondaryCtaLabel || 'Get a quote'
  const rating = settings.rating
  const firstAccreditation = settings.accreditations?.[0]

  // Each chip carries its own icon so the shield always sits with the accreditation,
  // regardless of which optional CMS fields are filled in.
  const chips = [
    settings.establishedYear ? { label: `Established ${settings.establishedYear}`, icon: 'check' as const } : null,
    firstAccreditation?.name ? { label: firstAccreditation.name, icon: 'shield' as const } : null,
    settings.insuranceText ? { label: settings.insuranceText, icon: 'check' as const } : null,
  ].filter((c): c is { label: string; icon: 'check' | 'shield' } => Boolean(c))

  return (
    <section className="relative isolate overflow-hidden bg-[color:var(--color-brand-dark)] text-white">
      {image ? (
        <>
          <Image
            src={image.url}
            alt={image.alt || settings.businessName}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="-z-20 object-cover"
          />
          {/* 30–40% dark scrim for legible text over the photo. */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                'linear-gradient(100deg, var(--color-brand-dark) 0%, color-mix(in srgb, var(--color-brand-dark) 78%, transparent) 45%, color-mix(in srgb, var(--color-brand-dark) 40%, transparent) 100%)',
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'linear-gradient(135deg, var(--color-brand-dark) 0%, var(--color-brand) 55%, var(--color-brand-light) 100%)',
          }}
        />
      )}

      <div className="container-x py-20 md:py-28 lg:py-32">
        <div className="max-w-2xl">
          {home.heroShowRating && rating?.value ? (
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-white/12 px-4 py-2 backdrop-blur">
              <Stars value={rating.value} size={17} />
              <span className="text-sm font-medium text-white">
                {rating.value}
                {rating.count ? ` · ${rating.count} ${rating.source || ''} reviews`.trimEnd() : ''}
              </span>
            </div>
          ) : null}

          <h1 className="text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
            {home.heroHeadline}
          </h1>

          {home.heroSubheadline && (
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-100/90 sm:text-xl">
              {home.heroSubheadline}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {tel && (
              <a href={tel} className="btn btn-accent text-lg">
                <PhoneIcon className="h-5 w-5" />
                {primaryLabel}
              </a>
            )}
            <a href="#contact" className="btn btn-on-dark text-lg">
              {secondaryLabel}
            </a>
          </div>

          {chips.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
              {chips.map((chip, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-medium text-slate-100">
                  {chip.icon === 'shield' ? (
                    <ShieldCheckIcon className="h-5 w-5 text-[color:var(--color-accent)]" />
                  ) : (
                    <CheckIcon className="h-5 w-5 text-[color:var(--color-accent)]" />
                  )}
                  {chip.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

export default Hero
