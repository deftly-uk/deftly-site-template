import React from 'react'

import type { SiteSetting } from '@/payload-types'
import { telHref } from '@/lib/format'

import { PhoneIcon, QuoteIcon } from './icons'

/**
 * Fixed bottom bar on mobile only — the phone call is the primary conversion
 * for trades, so it's one tap from anywhere on the page.
 */
export const MobileCallBar: React.FC<{ settings: SiteSetting }> = ({ settings }) => {
  const tel = telHref(settings.phone)
  if (!tel) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-px border-t border-[color:var(--color-line)] bg-[color:var(--color-line)] md:hidden">
      <a
        href={tel}
        className="flex items-center justify-center gap-2 bg-[color:var(--color-accent-strong)] py-3.5 font-[family-name:var(--font-heading)] font-semibold text-white"
      >
        <PhoneIcon className="h-5 w-5" />
        {settings.cta?.callLabel || 'Call now'}
      </a>
      <a
        href="#contact"
        className="flex items-center justify-center gap-2 bg-[color:var(--color-brand)] py-3.5 font-[family-name:var(--font-heading)] font-semibold text-white"
      >
        <QuoteIcon className="h-5 w-5" />
        {settings.cta?.quoteLabel || 'Get a quote'}
      </a>
    </div>
  )
}

export default MobileCallBar
