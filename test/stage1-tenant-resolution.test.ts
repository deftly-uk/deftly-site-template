import { describe, expect, it } from 'vitest'

import { extractSubdomain } from '@/lib/tenant'

/**
 * STAGE 1 — hostname → tenant routing. The pure host-parsing step that decides which
 * tenant a request belongs to. ROOT_DOMAIN is `localhost` in tests (vitest.config.ts).
 */
describe('Stage 1: hostname → subdomain extraction', () => {
  it('extracts the subdomain from a dev host', () => {
    expect(extractSubdomain('ashworth.localhost')).toBe('ashworth')
    expect(extractSubdomain('ashworth.localhost:3000')).toBe('ashworth')
    expect(extractSubdomain('PENNINE.Localhost:3000')).toBe('pennine')
  })

  it('returns null for the bare apex / www', () => {
    expect(extractSubdomain('localhost')).toBeNull()
    expect(extractSubdomain('localhost:3000')).toBeNull()
    expect(extractSubdomain('www.localhost')).toBeNull()
  })

  it('returns null for an empty / missing host', () => {
    expect(extractSubdomain(null)).toBeNull()
    expect(extractSubdomain(undefined)).toBeNull()
    expect(extractSubdomain('')).toBeNull()
  })

  it('returns null for an unrelated custom domain (resolved separately)', () => {
    expect(extractSubdomain('acmeplumbing.co.uk')).toBeNull()
  })
})
