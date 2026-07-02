import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { SiteSetting } from '@/payload-types'
import { getImage } from '@/lib/media'
import { phoneLabel, telHref } from '@/lib/format'

import { PhoneIcon } from './icons'

/** Sticky site header: brand + always-visible click-to-call + quote CTA (Article I / conversion). */
export const Header: React.FC<{ settings: SiteSetting }> = ({ settings }) => {
  const logo = getImage(settings.logo, 'card')
  const label = phoneLabel(settings)
  const tel = telHref(settings.phone)

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--color-line)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-x flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-2.5" aria-label={settings.businessName}>
          {logo ? (
            <Image
              src={logo.url}
              alt={logo.alt || settings.businessName}
              width={logo.width}
              height={logo.height}
              priority
              className="h-10 w-auto md:h-11"
            />
          ) : (
            <span className="font-[family-name:var(--font-heading)] text-lg font-extrabold leading-tight tracking-tight text-[color:var(--color-brand)] md:text-xl">
              {settings.businessName}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          {tel && (
            <a
              href={tel}
              className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[color:var(--color-brand)] transition-colors hover:bg-[color:var(--color-surface)]"
              aria-label={`Call ${settings.businessName} on ${label}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-surface)] text-[color:var(--color-accent)]">
                <PhoneIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-xs font-medium text-[color:var(--color-muted)]">
                  {settings.cta?.callCaption || 'Call us today'}
                </span>
                <span className="block text-[1.0625rem] font-bold tracking-tight">{label}</span>
              </span>
            </a>
          )}
          <a href="#contact" className="btn btn-accent hidden h-11 min-h-0 px-5 text-base md:inline-flex">
            {settings.cta?.quoteLabel || 'Get a quote'}
          </a>
        </div>
      </div>
    </header>
  )
}

export default Header
