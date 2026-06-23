import Image from 'next/image'
import React from 'react'

import type { HomePage, SiteSetting } from '@/payload-types'
import { getImage } from '@/lib/media'
import { CheckIcon, ShieldCheckIcon } from '@/components/icons'

type Props = { home: HomePage; settings: SiteSetting }

/** Trust strip — accreditations + guarantees, repeated proof right under the hero. */
export const TrustStrip: React.FC<Props> = ({ home, settings }) => {
  if (home.trustStripEnabled === false) return null

  const accreditations = settings.accreditations || []
  const highlights = (home.trustHighlights || []).map((h) => h.text).filter(Boolean)
  const guarantees = [settings.guaranteeText, settings.insuranceText].filter(Boolean) as string[]

  const hasContent = accreditations.length > 0 || highlights.length > 0 || guarantees.length > 0
  if (!hasContent) return null

  return (
    <section aria-label="Accreditations and guarantees" className="border-b border-[color:var(--color-line)] bg-[color:var(--color-surface)]">
      <div className="container-x py-7">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5 md:justify-between">
          {/* Accreditation badges */}
          {accreditations.map((acc, i) => {
            const logo = getImage(acc.logo, 'thumbnail')
            return (
              <div key={i} className="flex items-center gap-2.5">
                {logo ? (
                  <Image src={logo.url} alt={logo.alt || acc.name} width={logo.width} height={logo.height} className="h-11 w-auto object-contain" />
                ) : (
                  <ShieldCheckIcon className="h-6 w-6 text-[color:var(--color-brand)]" />
                )}
                <span className="text-sm font-semibold leading-tight text-[color:var(--color-ink)]">
                  {acc.name}
                  {acc.registrationNumber && (
                    <span className="block text-xs font-normal text-[color:var(--color-muted)]">
                      Reg. {acc.registrationNumber}
                    </span>
                  )}
                </span>
              </div>
            )
          })}

          {/* Guarantees + quick promises */}
          {[...guarantees, ...highlights].map((text, i) => (
            <div key={`g-${i}`} className="flex items-center gap-2 text-sm font-medium text-[color:var(--color-ink)]">
              <CheckIcon className="h-5 w-5 shrink-0 text-[color:var(--color-accent)]" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TrustStrip
