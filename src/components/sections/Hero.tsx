import Image from 'next/image'
import React from 'react'

import type { HomePage, SiteSetting } from '@/payload-types'
import type { HeroStyle } from '@/lib/presets'
import { getImage } from '@/lib/media'
import { telHref } from '@/lib/format'
import { Stars } from '@/components/Stars'
import { CheckIcon, PhoneIcon, ShieldCheckIcon } from '@/components/icons'

type Props = { home: HomePage; settings: SiteSetting; variant?: HeroStyle }

/** Trust chips built only from CAPTURED facts (established year, an accreditation the
 *  customer holds, an insurance line) — never an unearned default claim. */
const trustChips = (settings: SiteSetting) => {
  const firstAccreditation = settings.accreditations?.[0]
  return [
    settings.establishedYear ? { label: `Established ${settings.establishedYear}`, icon: 'check' as const } : null,
    firstAccreditation?.name ? { label: firstAccreditation.name, icon: 'shield' as const } : null,
    settings.insuranceText ? { label: settings.insuranceText, icon: 'check' as const } : null,
  ].filter((c): c is { label: string; icon: 'check' | 'shield' } => Boolean(c))
}

const RatingChip: React.FC<{ settings: SiteSetting; className?: string }> = ({ settings, className }) => {
  const rating = settings.rating
  if (!rating?.value) return null
  return (
    <div className={`inline-flex items-center gap-2.5 rounded-full bg-white/12 px-4 py-2 backdrop-blur ${className ?? ''}`}>
      <Stars value={rating.value} size={17} />
      <span className="text-sm font-medium text-white">
        {rating.value}
        {rating.count ? ` · ${rating.count} ${rating.source || ''} reviews`.trimEnd() : ''}
      </span>
    </div>
  )
}

/**
 * Hero — answers "who/what/where + reassurance" in one screen, with call + quote CTAs.
 * Three preset variants (design only; copy + claims are identical):
 *   • editorial — The Reliable: left-aligned, clean CSS hero (or a photo if one exists).
 *   • soft      — Friendly Local: centred, photo-led, warmer.
 *   • emergency — Emergency Red: single-column urgency with an oversized "call now".
 */
export const Hero: React.FC<Props> = ({ home, settings, variant = 'editorial' }) => {
  const image = getImage(home.heroImage, 'hero')
  const tel = telHref(settings.phone)
  const phoneLabel = settings.phoneDisplay || settings.phone
  const primaryLabel = home.heroPrimaryCtaLabel || 'Call now'
  const secondaryLabel = home.heroSecondaryCtaLabel || 'Get a quote'
  const chips = trustChips(settings)

  // ── Emergency: single-column urgency, oversized tappable phone number ──────────
  if (variant === 'emergency') {
    return (
      <section className="relative isolate overflow-hidden bg-[color:var(--color-brand-dark)] text-white">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: 'linear-gradient(160deg, var(--color-brand-dark) 0%, var(--color-brand) 100%)' }}
        />
        {/* Urgency ribbon — shown ONLY when the customer actually gave an out-of-hours
            note, so we never assert an unearned "24/7" claim. */}
        {settings.emergencyText ? (
          <div className="bg-[color:var(--color-accent-strong)] text-center">
            <div className="container-x py-2 text-sm font-bold uppercase tracking-wide text-white">
              {settings.emergencyText}
            </div>
          </div>
        ) : null}

        <div className="container-x py-16 text-center md:py-24">
          {home.heroShowRating ? <RatingChip settings={settings} className="mx-auto mb-6" /> : null}

          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            {home.heroHeadline}
          </h1>

          {home.heroSubheadline && (
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-100/90 sm:text-xl">
              {home.heroSubheadline}
            </p>
          )}

          {tel && (
            <a href={tel} className="mt-8 inline-flex flex-col items-center gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">{primaryLabel}</span>
              <span className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{phoneLabel}</span>
            </a>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2.5">
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
      </section>
    )
  }

  // ── Editorial (default) + Soft (centred, photo-led) share one layout ───────────
  const centered = variant === 'soft'

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
          {/* Dark scrim for legible text over the photo (softer + more even when centred). */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: centered
                ? 'linear-gradient(180deg, color-mix(in srgb, var(--color-brand-dark) 55%, transparent) 0%, color-mix(in srgb, var(--color-brand-dark) 80%, transparent) 100%)'
                : 'linear-gradient(100deg, var(--color-brand-dark) 0%, color-mix(in srgb, var(--color-brand-dark) 78%, transparent) 45%, color-mix(in srgb, var(--color-brand-dark) 40%, transparent) 100%)',
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
        <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
          {home.heroShowRating ? <RatingChip settings={settings} className={centered ? 'mx-auto mb-6' : 'mb-6'} /> : null}

          <h1 className="text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
            {home.heroHeadline}
          </h1>

          {home.heroSubheadline && (
            <p
              className={`mt-5 max-w-xl text-lg leading-relaxed text-slate-100/90 sm:text-xl ${
                centered ? 'mx-auto' : ''
              }`}
            >
              {home.heroSubheadline}
            </p>
          )}

          <div className={`mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap ${centered ? 'sm:justify-center' : ''}`}>
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
            <ul className={`mt-8 flex flex-wrap gap-x-6 gap-y-2.5 ${centered ? 'justify-center' : ''}`}>
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
