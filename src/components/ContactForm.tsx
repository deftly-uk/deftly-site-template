'use client'

import React, { useActionState } from 'react'

import { submitEnquiry } from '@/app/(frontend)/actions'
import { initialContactState } from '@/lib/contact-types'
import { CheckIcon } from '@/components/icons'

type Props = {
  submitLabel: string
  successMessage: string
}

const fieldClass =
  'w-full rounded-lg border border-[color:var(--color-line)] bg-white px-4 py-3 text-[color:var(--color-ink)] shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand)]/20'
const labelClass = 'mb-1.5 block text-sm font-semibold text-[color:var(--color-ink)]'
const errorClass = 'mt-1 text-sm font-medium text-red-600'

export const ContactForm: React.FC<Props> = ({ submitLabel, successMessage }) => {
  const [state, formAction, isPending] = useActionState(submitEnquiry, initialContactState)

  if (state.status === 'success') {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-xl bg-[color:var(--color-surface)] p-8 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-white">
          <CheckIcon className="h-7 w-7" />
        </span>
        <p className="text-lg font-semibold text-[color:var(--color-ink)]">{successMessage}</p>
      </div>
    )
  }

  return (
    <form action={formAction} noValidate className="space-y-4">
      {/* Honeypot — hidden from people, catches bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={fieldClass}
            aria-invalid={Boolean(state.errors?.name)}
            aria-describedby={state.errors?.name ? 'name-error' : undefined}
          />
          {state.errors?.name && (
            <p id="name-error" className={errorClass}>
              {state.errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            className={fieldClass}
            aria-invalid={Boolean(state.errors?.phone)}
            aria-describedby={state.errors?.phone ? 'phone-error' : undefined}
          />
          {state.errors?.phone && (
            <p id="phone-error" className={errorClass}>
              {state.errors.phone}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="postcode" className={labelClass}>
          Postcode <span className="font-normal text-[color:var(--color-muted)]">(optional)</span>
        </label>
        <input
          id="postcode"
          name="postcode"
          type="text"
          autoComplete="postal-code"
          className={`${fieldClass} sm:max-w-[12rem]`}
        />
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          How can we help? <span className="font-normal text-[color:var(--color-muted)]">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={fieldClass}
          aria-invalid={Boolean(state.errors?.message)}
          aria-describedby={state.errors?.message ? 'message-error' : undefined}
        />
        {state.errors?.message && (
          <p id="message-error" className={errorClass}>
            {state.errors.message}
          </p>
        )}
      </div>

      {state.status === 'error' && state.message && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn btn-accent w-full text-lg">
        {isPending ? 'Sending…' : submitLabel}
      </button>
    </form>
  )
}

export default ContactForm
