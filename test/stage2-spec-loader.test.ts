import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import type { Tenant } from '@/payload-types'
import { parseSiteSpec, safeParseSiteSpec } from '@/lib/spec/schema'
import { PLUMBER_SAMPLE_INPUT } from '@/lib/spec/sample-plumber'
import { loadTenantFromSpec } from '@/lib/spec/load-tenant'
import { tenantMediaPrefix } from '@/lib/storage'

import { getTestPayload, uniqueSub } from './helpers/payload'

/**
 * STAGE 2 — spec-driven content loader. Feeding a sample plumber spec must produce a
 * correctly-populated, editable tenant, validated against the schema + the worked
 * fixture. Stock placeholders stand in when the customer has no real photos yet.
 */
describe('Stage 2: SiteSpec contract', () => {
  it('the mirrored schema is byte-identical to the CRM source of truth (when present)', () => {
    const crmSchema = fileURLToPath(new URL('../../deftly-app/src/lib/spec/schema.ts', import.meta.url))
    if (!existsSync(crmSchema)) {
      // CRM repo not checked out alongside (e.g. CI) — nothing to compare against.
      return
    }
    const here = fileURLToPath(new URL('../src/lib/spec/schema.ts', import.meta.url))
    expect(readFileSync(here, 'utf8')).toBe(readFileSync(crmSchema, 'utf8'))
  })

  it('accepts the worked fixture and rejects an invalid spec', () => {
    expect(() => parseSiteSpec(PLUMBER_SAMPLE_INPUT)).not.toThrow()
    // services must have at least one entry
    const bad = safeParseSiteSpec({ ...PLUMBER_SAMPLE_INPUT, services: [] })
    expect(bad.success).toBe(false)
  })

  it('applies schema defaults (brand colours) for fields the rep left blank', () => {
    const spec = parseSiteSpec(PLUMBER_SAMPLE_INPUT)
    expect(spec.story.brandColor).toMatch(/^#[0-9a-f]{6}$/i)
    expect(spec.story.accentColor).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('Stage 2: loading a tenant from a spec', () => {
  let payload: Payload
  let tenant: Tenant
  let sub: string

  beforeAll(async () => {
    payload = await getTestPayload()
    sub = uniqueSub('plumber')
    const result = await loadTenantFromSpec(payload, PLUMBER_SAMPLE_INPUT, {
      subdomain: sub,
      adminEmail: `${sub}@owner.test`,
      adminPassword: 'test-password-123',
      status: 'active',
    })
    tenant = result.tenant
  })

  it('creates the tenant with the right routing + industry', () => {
    expect(tenant.subdomain).toBe(sub)
    expect(tenant.industry).toBe('plumber')
    expect(tenant.name).toBe('Brightwell Plumbing & Heating Ltd')
  })

  it('populates site settings from the spec', async () => {
    const { docs } = await payload.find({ collection: 'site-settings', where: { tenant: { equals: tenant.id } }, limit: 1, overrideAccess: true })
    const settings = docs[0]
    expect(settings.businessName).toBe('Brightwell Plumbing & Heating Ltd')
    expect(settings.tradeType).toBe('Plumber')
    expect(settings.phone).toBe('+447700900142')
    expect(settings.rating?.value).toBe(4.8)
    expect((settings.accreditations ?? []).map((a) => a.name)).toContain('Gas Safe')
    expect((settings.areasServed ?? []).map((a) => a.area)).toContain('Manchester')
    // Auto-generated privacy policy present even though the spec carried none.
    expect(settings.privacyPolicy).toBeTruthy()
  })

  it('auto-generates the hero headline the spec left blank', async () => {
    const { docs } = await payload.find({ collection: 'home-page', where: { tenant: { equals: tenant.id } }, limit: 1, overrideAccess: true })
    const home = docs[0]
    expect(home.heroHeadline).toBeTruthy()
    expect(home.heroHeadline).toContain('Manchester') // primary town woven in
  })

  it('maps services with sensible icons and headline ordering', async () => {
    const { docs } = await payload.find({ collection: 'services', where: { tenant: { equals: tenant.id } }, sort: 'order', limit: 100, overrideAccess: true })
    expect(docs.length).toBe(4)
    const boiler = docs.find((d) => /boiler/i.test(d.title))
    expect(boiler?.icon).toBe('flame')
    expect(boiler?.order).toBe(0) // isHeadline → first
  })

  it('loads testimonials from the spec', async () => {
    const { docs } = await payload.find({ collection: 'testimonials', where: { tenant: { equals: tenant.id } }, limit: 100, overrideAccess: true })
    expect(docs.length).toBe(1)
    expect(docs[0].authorName).toBe('Sarah T.')
  })

  it('falls back to per-tenant stock images when there are no real photos', async () => {
    const { docs } = await payload.find({ collection: 'media', where: { tenant: { equals: tenant.id } }, limit: 100, overrideAccess: true })
    expect(docs.length).toBeGreaterThanOrEqual(2)
    for (const m of docs) expect(m.prefix).toBe(tenantMediaPrefix(sub))
  })

  it('is idempotent — re-running the same spec does not duplicate the tenant or its content', async () => {
    // Runs BEFORE the edit test below, so title-keyed upserts still match the originals.
    await loadTenantFromSpec(payload, PLUMBER_SAMPLE_INPUT, { subdomain: sub, provisionAdmin: false, status: 'active' })
    const tenants = await payload.find({ collection: 'tenants', where: { subdomain: { equals: sub } }, limit: 100, overrideAccess: true })
    expect(tenants.totalDocs).toBe(1)
    const services = await payload.find({ collection: 'services', where: { tenant: { equals: tenant.id } }, limit: 100, overrideAccess: true })
    expect(services.totalDocs).toBe(4) // still four, not eight
  })

  it('produces an EDITABLE tenant — the provisioned admin can change content (Article II)', async () => {
    const { user } = await payload.login({ collection: 'users', data: { email: `${sub}@owner.test`, password: 'test-password-123' } })
    const { docs } = await payload.find({ collection: 'services', where: { tenant: { equals: tenant.id } }, limit: 1, overrideAccess: true })
    const serviceId = docs[0].id

    await payload.update({ collection: 'services', id: serviceId, data: { title: 'Edited by owner' }, overrideAccess: false, user })
    const after = await payload.findByID({ collection: 'services', id: serviceId, overrideAccess: true })
    expect(after.title).toBe('Edited by owner')
  })
})
