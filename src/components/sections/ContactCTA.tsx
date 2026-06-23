import React from 'react'

import type { HomePage, SiteSetting } from '@/payload-types'
import { phoneLabel, telHref, whatsappHref } from '@/lib/format'
import { ContactForm } from '@/components/ContactForm'
import { CheckIcon, PhoneIcon, WhatsappIcon } from '@/components/icons'

type Props = { home: HomePage; settings: SiteSetting }

/** Final CTA band + contact form. The brand-coloured close: call (primary) or short form. */
export const ContactCTA: React.FC<Props> = ({ home, settings }) => {
  const tel = telHref(settings.phone)
  const label = phoneLabel(settings)
  const whatsapp = whatsappHref(settings.whatsapp)
  const reassurances = (home.contactReassurances || []).map((r) => r.text).filter(Boolean)

  return (
    <section
      id="contact"
      className="section scroll-mt-20 bg-[color:var(--color-brand)] text-white"
      style={{
        backgroundImage:
          'linear-gradient(135deg, var(--color-brand-dark) 0%, var(--color-brand) 60%, var(--color-brand-light) 130%)',
      }}
    >
      <div className="container-x">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              {home.contactHeading || 'Get a free, no-obligation quote'}
            </h2>
            {home.contactBody && (
              <p className="mt-4 text-lg leading-relaxed text-slate-100/90">{home.contactBody}</p>
            )}

            {reassurances.length > 0 && (
              <ul className="mt-7 space-y-3">
                {reassurances.map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-50">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-white">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <span className="font-medium">{text}</span>
                  </li>
                ))}
              </ul>
            )}

            {tel && (
              <div className="mt-9 rounded-xl bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-medium text-slate-200">
                  {home.contactCallPrompt || 'Prefer to talk now? Call us:'}
                </p>
                <a
                  href={tel}
                  className="mt-1 flex items-center gap-3 font-[family-name:var(--font-heading)] text-2xl font-extrabold text-white transition-opacity hover:opacity-90 sm:text-3xl"
                >
                  <PhoneIcon className="h-7 w-7 text-[color:var(--color-accent)]" />
                  {label}
                </a>
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-100 underline-offset-2 hover:underline"
                  >
                    <WhatsappIcon className="h-5 w-5 text-[color:var(--color-accent)]" />
                    Or message us on WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <ContactForm
              submitLabel={home.contactSubmitLabel || 'Request a callback'}
              successMessage={
                home.contactSuccessMessage ||
                "Thanks — we've got your details and will be in touch shortly."
              }
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactCTA
