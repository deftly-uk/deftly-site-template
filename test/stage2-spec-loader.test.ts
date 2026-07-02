import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import type { Tenant } from '@/payload-types'
import { parseSiteSpec, safeParseSiteSpec } from '@/lib/spec/schema'
import { PLUMBER_SAMPLE_INPUT } from '@/lib/spec/sample-plumber'
import { loadTenantFromSpec } from '@/lib/spec/load-tenant'

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

  it('seeds NO stock imagery for the editorial default (The Reliable)', async () => {
    // The Reliable is a clean, no-photo editorial look: no hero image and no About image
    // are seeded, so the site renders its considered CSS hero + a centred About block.
    // The customer adds their own photos later and they appear automatically (Article I).
    const { docs: media } = await payload.find({ collection: 'media', where: { tenant: { equals: tenant.id } }, limit: 100, overrideAccess: true })
    expect(media.length).toBe(0)

    const home = (await payload.find({ collection: 'home-page', where: { tenant: { equals: tenant.id } }, limit: 1, overrideAccess: true })).docs[0]
    expect(home.heroImage).toBeFalsy()
    expect(home.aboutImage).toBeFalsy()
  })

  it('applies the plumber launch palette when the rep captured no colour', async () => {
    const settings = (await payload.find({ collection: 'site-settings', where: { tenant: { equals: tenant.id } }, limit: 1, overrideAccess: true })).docs[0]
    expect(settings.brandColor).toBe('#14324f')
    expect(settings.accentColor).toBe('#e0620d')
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

  it('rebuild is additive-safe — owner edits to a MATCHING row survive a re-run (MVP, ADR 0001)', async () => {
    // Self-contained tenant (no shared mutable state): build, then the owner edits content
    // the way the admin UI would (logged in, real access control), then we rebuild.
    const s = uniqueSub('additive')
    const email = `${s}@owner.test`
    await loadTenantFromSpec(payload, PLUMBER_SAMPLE_INPUT, { subdomain: s, adminEmail: email, adminPassword: 'test-password-123', status: 'active' })
    const t = (await payload.find({ collection: 'tenants', where: { subdomain: { equals: s } }, limit: 1, overrideAccess: true })).docs[0]
    const { user } = await payload.login({ collection: 'users', data: { email, password: 'test-password-123' } })

    // Edit a service's SUMMARY (title unchanged, so the spec still matches this row on
    // rebuild) and a per-tenant global field, both as the logged-in owner.
    const svc = (await payload.find({ collection: 'services', where: { tenant: { equals: t.id } }, sort: 'order', limit: 1, overrideAccess: true })).docs[0]
    await payload.update({ collection: 'services', id: svc.id, data: { summary: 'OWNER EDIT keep me' }, overrideAccess: false, user })
    const settings = (await payload.find({ collection: 'site-settings', where: { tenant: { equals: t.id } }, limit: 1, overrideAccess: true })).docs[0]
    await payload.update({ collection: 'site-settings', id: settings.id, data: { phone: '09999999999' }, overrideAccess: false, user })

    const countBefore = (await payload.find({ collection: 'services', where: { tenant: { equals: t.id } }, limit: 100, overrideAccess: true })).totalDocs

    // Rebuild from the same spec.
    await loadTenantFromSpec(payload, PLUMBER_SAMPLE_INPUT, { subdomain: s, provisionAdmin: false, status: 'active' })

    const svcAfter = await payload.findByID({ collection: 'services', id: svc.id, overrideAccess: true })
    expect(svcAfter.summary).toBe('OWNER EDIT keep me') // the matching existing row was left untouched
    const countAfter = (await payload.find({ collection: 'services', where: { tenant: { equals: t.id } }, limit: 100, overrideAccess: true })).totalDocs
    expect(countAfter).toBe(countBefore) // no duplicate created for the matching service
    const settingsAfter = await payload.findByID({ collection: 'site-settings', id: settings.id, overrideAccess: true })
    expect(settingsAfter.phone).toBe('09999999999') // the global edit survived the rebuild
  })

  it('rebuild preserves live routing/lifecycle metadata (customDomain + status)', async () => {
    const s = uniqueSub('domain')
    // First build (pending), then the platform attaches a custom domain and goes live.
    await loadTenantFromSpec(payload, PLUMBER_SAMPLE_INPUT, { subdomain: s, provisionAdmin: false, status: 'pending' })
    const created = (await payload.find({ collection: 'tenants', where: { subdomain: { equals: s } }, limit: 1, overrideAccess: true })).docs[0]
    await payload.update({ collection: 'tenants', id: created.id, data: { customDomain: 'myplumber.co.uk', status: 'active' }, overrideAccess: true })

    // Rebuild the way the worker does: status 'pending', no customDomain provided.
    await loadTenantFromSpec(payload, PLUMBER_SAMPLE_INPUT, { subdomain: s, provisionAdmin: false, status: 'pending' })

    const after = (await payload.find({ collection: 'tenants', where: { subdomain: { equals: s } }, limit: 1, overrideAccess: true })).docs[0]
    expect(after.customDomain).toBe('myplumber.co.uk') // not cleared → custom-domain site stays online
    expect(after.status).toBe('active') // not downgraded back to pending
  })
})
