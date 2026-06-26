import { afterEach, describe, expect, it } from 'vitest'

import { sendSiteReadyEmail } from '@/lib/email'
import { previewUrlFor } from '@/lib/queue/worker'

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
  })
})
