import Link from 'next/link'
import React from 'react'

import type { SiteSetting } from '@/payload-types'
import { formatAddress, phoneLabel, telHref } from '@/lib/format'

import {
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from './icons'

const dayLabel = (days?: (string | null)[] | null): string => {
  if (!days || days.length === 0) return ''
  const short = days.map((d) => (d || '').slice(0, 3))
  return short.length > 2 ? `${short[0]}–${short[short.length - 1]}` : short.join(' & ')
}

/** Footer with the UK legal floor (company details) + contact, hours, areas, social. */
export const Footer: React.FC<{ settings: SiteSetting }> = ({ settings }) => {
  const tel = telHref(settings.phone)
  const label = phoneLabel(settings)
  const address = formatAddress(settings.address)
  const areas = (settings.areasServed || []).map((a) => a.area).filter(Boolean)
  const year = new Date().getFullYear()
  const legalName = settings.legalName || settings.businessName

  return (
    <footer className="bg-[color:var(--color-brand-dark)] text-slate-300">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand + blurb */}
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-xl font-extrabold text-white">
            {settings.businessName}
          </h3>
          {settings.tagline && <p className="mt-3 text-sm leading-relaxed text-slate-400">{settings.tagline}</p>}
          {(settings.social?.facebook || settings.social?.instagram) && (
            <div className="mt-4 flex gap-3">
              {settings.social?.facebook && (
                <a href={settings.social.facebook} aria-label="Facebook" className="text-slate-400 transition-colors hover:text-white" target="_blank" rel="noopener noreferrer">
                  <FacebookIcon className="h-6 w-6" />
                </a>
              )}
              {settings.social?.instagram && (
                <a href={settings.social.instagram} aria-label="Instagram" className="text-slate-400 transition-colors hover:text-white" target="_blank" rel="noopener noreferrer">
                  <InstagramIcon className="h-6 w-6" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wider text-white">
            Contact
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            {tel && (
              <li>
                <a href={tel} className="flex items-center gap-2.5 transition-colors hover:text-white">
                  <PhoneIcon className="h-[18px] w-[18px] shrink-0 text-[color:var(--color-accent)]" />
                  {label}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 break-all transition-colors hover:text-white">
                  <MailIcon className="h-[18px] w-[18px] shrink-0 text-[color:var(--color-accent)]" />
                  {settings.email}
                </a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2.5">
                <MapPinIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--color-accent)]" />
                <span>{address}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Opening hours */}
        {settings.openingHours && settings.openingHours.length > 0 && (
          <div>
            <h4 className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wider text-white">
              Opening hours
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {settings.openingHours.map((row, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-400">
                    <ClockIcon className="h-4 w-4" />
                    {dayLabel(row.days)}
                  </span>
                  <span className="text-slate-200">
                    {row.closed ? 'Closed' : [row.opens, row.closes].filter(Boolean).join('–')}
                  </span>
                </li>
              ))}
            </ul>
            {settings.emergencyText && (
              <p className="mt-3 text-sm font-medium text-[color:var(--color-accent)]">{settings.emergencyText}</p>
            )}
          </div>
        )}

        {/* Areas served */}
        {areas.length > 0 && (
          <div>
            <h4 className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wider text-white">
              Areas we cover
            </h4>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{areas.join(' · ')}</p>
          </div>
        )}
      </div>

      {/* Legal floor */}
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs leading-relaxed text-slate-400 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p>
              © {year} {legalName}.
              {settings.companyNumber && (
                <> Registered in England and Wales no. {settings.companyNumber}.</>
              )}
              {settings.vatNumber && <> VAT no. {settings.vatNumber}.</>}
            </p>
            {settings.registeredOffice && (
              <p>Registered office: {settings.registeredOffice}</p>
            )}
          </div>
          <Link href="/privacy" className="shrink-0 underline underline-offset-2 transition-colors hover:text-white">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
