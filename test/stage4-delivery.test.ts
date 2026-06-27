import { afterEach, describe, expect, it } from 'vitest'

import { buildSiteReadyEmail, sendSiteReadyEmail } from '@/lib/email'
import { previewUrlFor } from '@/lib/queue/worker'

const baseEnv = {
  repName: 'The Deftly team',
  price: '',
  phone: '',
  checkoutUrl: '',
  paymentOff: false,
}

/**
 * STAGE 4 — self-serve delivery. The link the worker records and the "site is ready"
 * email. No DB needed: these are the pure URL builder + the email helper's guard rails
 * (it must never throw or send when unconfigured, so a missing key can't fail a build).
 */
describe('Stage 4: delivery', () => {
  const ENV_KEYS = ['PREVIEW_PATH_BASE', 'PREVIEW_BASE_DOMAIN', 'RESEND_API_KEY', 'CONTACT_TO_EMAIL_FALLBACK'] as const
  const saved: Record<string, string | undefined> = {}
  for (const k of ENV_KEYS) saved[k] = process.env[k]

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  describe('previewUrlFor', () => {
    it('does not invent a placeholder domain when no preview base is configured', () => {
      delete process.env.PREVIEW_PATH_BASE
      delete process.env.PREVIEW_BASE_DOMAIN
      expect(previewUrlFor('acme-123abc')).toBeNull()
    })

    it('uses subdomain mode by default', () => {
      delete process.env.PREVIEW_PATH_BASE
      process.env.PREVIEW_BASE_DOMAIN = 'deftly.uk'
      expect(previewUrlFor('acme-123abc')).toBe('https://acme-123abc.deftly.uk')
    })

    it('uses path mode when PREVIEW_PATH_BASE is set (trailing slash tolerated)', () => {
      process.env.PREVIEW_PATH_BASE = 'https://deftly-site-template.vercel.app/s/'
      expect(previewUrlFor('acme-123abc')).toBe('https://deftly-site-template.vercel.app/s/acme-123abc')
    })
  })

  describe('sendSiteReadyEmail', () => {
    it('skips (never throws) when no API key is configured', async () => {
      delete process.env.RESEND_API_KEY
      const res = await sendSiteReadyEmail({ businessName: 'Acme', siteUrl: 'https://x/s/acme', to: 'a@b.test' })
      expect(res.sent).toBe(false)
      expect(res.reason).toBe('no-api-key')
    })

    it('skips when there is no recipient in the spec or env fallback', async () => {
      process.env.RESEND_API_KEY = 'test-key-not-used'
      delete process.env.CONTACT_TO_EMAIL_FALLBACK
      const res = await sendSiteReadyEmail({ businessName: 'Acme', siteUrl: 'https://x/s/acme', to: null })
      expect(res.sent).toBe(false)
      expect(res.reason).toBe('no-recipient')
    })

    it('never sends a dead link: skips when the site URL is empty', async () => {
      process.env.RESEND_API_KEY = 'test-key-not-used'
      process.env.CONTACT_TO_EMAIL_FALLBACK = 'fallback@b.test'
      const res = await sendSiteReadyEmail({ businessName: 'Acme', siteUrl: '   ', to: 'a@b.test' })
      expect(res.sent).toBe(false)
      expect(res.reason).toBe('no-link')
    })

    it('never sends when the preview URL builder could not produce a real link', async () => {
      delete process.env.PREVIEW_PATH_BASE
      delete process.env.PREVIEW_BASE_DOMAIN
      process.env.RESEND_API_KEY = 'test-key-not-used'
      const res = await sendSiteReadyEmail({ businessName: 'Acme', siteUrl: previewUrlFor('acme-123abc'), to: 'a@b.test' })
      expect(res.sent).toBe(false)
      expect(res.reason).toBe('no-link')
    })
  })

  describe('buildSiteReadyEmail copy', () => {
    const build = (over: Partial<typeof baseEnv> = {}) =>
      buildSiteReadyEmail({
        businessName: 'Acme Plumbing',
        siteUrl: 'https://deftly-site-template.vercel.app/s/acme-123abc',
        env: { ...baseEnv, ...over },
      })

    it('is a conversion email: business name + claim-for-a-few-days, with the link', () => {
      const { subject, text, html } = build()
      expect(subject).toContain('Acme Plumbing')
      expect(subject.toLowerCase()).toContain('claim')
      expect(text).toContain('https://deftly-site-template.vercel.app/s/acme-123abc')
      expect(html).toContain('https://deftly-site-template.vercel.app/s/acme-123abc')
    })

    it('softens the hold — never promises to release the site/address', () => {
      const { text } = build()
      expect(text).toContain('I can only keep this preview open for a few days')
      expect(text.toLowerCase()).not.toContain('release')
    })

    it('contains no em dashes (house style)', () => {
      const { subject, text, html } = build()
      for (const s of [subject, text, html]) expect(s).not.toContain('—')
    })

    it('greyed payment teaser by default; real button when a checkout URL is set', () => {
      const greyed = build()
      expect(greyed.text).toContain('Secure checkout: available shortly')
      expect(greyed.html).not.toContain('href="https://pay.example')

      const live = build({ checkoutUrl: 'https://pay.example/acme', price: '£295' })
      expect(live.html).toContain('href="https://pay.example/acme"')
      expect(live.text).toContain('Claim my website for £295')
      expect(live.text).not.toContain('available shortly')
    })

    it('hides the payment block entirely when turned off', () => {
      const off = build({ paymentOff: true })
      expect(off.text).not.toContain('Claim my website')
      expect(off.html).not.toContain('Claim my website')
    })

    it('uses a reply-only contact line unless a phone is configured', () => {
      expect(build().text).toContain('just reply to this email')
      expect(build({ phone: '01234 567890' }).text).toContain('call me on 01234 567890')
    })
  })
})
