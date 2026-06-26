import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import type { Tenant, User } from '@/payload-types'
import { tenantMediaPrefix } from '@/lib/storage'
import { publicTenantRead } from '@/access/tenant'

import { getTestPayload, makeMedia, makeTenant, makeTenantAdmin, seedMinimalContent, uniqueSub } from './helpers/payload'

/**
 * STAGE 1 — tenant isolation (the non-negotiable proof).
 *
 * Two tenants in one app + one database. We prove that tenant A's admin cannot read,
 * edit, create, delete, or upload into tenant B's content, media or admin — and vice
 * versa — while each can fully manage their own. Every cross-tenant call goes through
 * the REAL access control (overrideAccess: false, with the acting user), exactly as a
 * request would.
 */
describe('Stage 1: tenant isolation', () => {
  let payload: Payload
  let tenantA: Tenant
  let tenantB: Tenant
  let adminA: User
  let adminB: User
  let aServiceId: number
  let bServiceId: number
  let aMediaId: number
  let bMediaId: number

  beforeAll(async () => {
    payload = await getTestPayload()

    tenantA = await makeTenant(payload, { subdomain: uniqueSub('iso-a'), name: 'Tenant A' })
    tenantB = await makeTenant(payload, { subdomain: uniqueSub('iso-b'), name: 'Tenant B' })

    adminA = await makeTenantAdmin(payload, tenantA.id, { email: uniqueSub('a') + '@test.dev' })
    adminB = await makeTenantAdmin(payload, tenantB.id, { email: uniqueSub('b') + '@test.dev' })

    await seedMinimalContent(payload, tenantA.id, 'Alpha')
    await seedMinimalContent(payload, tenantB.id, 'Bravo')

    aMediaId = await makeMedia(payload, tenantA.id, uniqueSub('a') + '.jpg')
    bMediaId = await makeMedia(payload, tenantB.id, uniqueSub('b') + '.jpg')

    aServiceId = (
      await payload.find({ collection: 'services', where: { tenant: { equals: tenantA.id } }, limit: 1, overrideAccess: true })
    ).docs[0].id as number
    bServiceId = (
      await payload.find({ collection: 'services', where: { tenant: { equals: tenantB.id } }, limit: 1, overrideAccess: true })
    ).docs[0].id as number
  })

  it('scopes list reads to the acting user\'s tenant (A never sees B)', async () => {
    const { docs } = await payload.find({ collection: 'services', overrideAccess: false, user: adminA, limit: 100 })
    expect(docs.length).toBeGreaterThan(0)
    for (const doc of docs) {
      const tenantId = typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant
      expect(tenantId).toBe(tenantA.id)
    }
    expect(docs.map((d) => d.id)).not.toContain(bServiceId)
  })

  it('blocks reading another tenant\'s document by id', async () => {
    await expect(
      payload.findByID({ collection: 'services', id: bServiceId, overrideAccess: false, user: adminA }),
    ).rejects.toThrow()
  })

  it('blocks editing another tenant\'s document (and leaves it unchanged)', async () => {
    await expect(
      payload.update({ collection: 'services', id: bServiceId, data: { title: 'HACKED' }, overrideAccess: false, user: adminA }),
    ).rejects.toThrow()
    const still = await payload.findByID({ collection: 'services', id: bServiceId, overrideAccess: true })
    expect(still.title).not.toBe('HACKED')
  })

  it('blocks deleting another tenant\'s document', async () => {
    await expect(
      payload.delete({ collection: 'services', id: bServiceId, overrideAccess: false, user: adminA }),
    ).rejects.toThrow()
    const still = await payload.findByID({ collection: 'services', id: bServiceId, overrideAccess: true })
    expect(still).toBeTruthy()
  })

  it('never lets A create a document under tenant B', async () => {
    let createdUnderB = false
    try {
      const created = await payload.create({
        collection: 'services',
        data: { tenant: tenantB.id, title: 'sneaky', summary: 'x' },
        overrideAccess: false,
        user: adminA,
      })
      const tenantId = typeof created.tenant === 'object' ? created.tenant?.id : created.tenant
      createdUnderB = tenantId === tenantB.id
    } catch {
      createdUnderB = false // rejected outright — also a pass
    }
    expect(createdUnderB).toBe(false)
  })

  it('scopes media (uploads) to the tenant — A cannot see B\'s media', async () => {
    const { docs } = await payload.find({ collection: 'media', overrideAccess: false, user: adminA, limit: 100 })
    expect(docs.map((d) => d.id)).toContain(aMediaId)
    expect(docs.map((d) => d.id)).not.toContain(bMediaId)
    await expect(
      payload.findByID({ collection: 'media', id: bMediaId, overrideAccess: false, user: adminA }),
    ).rejects.toThrow()
  })

  it('stores each tenant\'s media under its own per-tenant prefix', async () => {
    const a = await payload.findByID({ collection: 'media', id: aMediaId, overrideAccess: true })
    const b = await payload.findByID({ collection: 'media', id: bMediaId, overrideAccess: true })
    expect(a.prefix).toBe(tenantMediaPrefix(tenantA.subdomain))
    expect(b.prefix).toBe(tenantMediaPrefix(tenantB.subdomain))
    expect(a.prefix).not.toBe(b.prefix)
  })

  it('scopes enquiries (the lead inbox) to the tenant', async () => {
    const { docs } = await payload.find({ collection: 'enquiries', overrideAccess: false, user: adminA, limit: 100 })
    expect(docs.length).toBeGreaterThan(0)
    for (const doc of docs) {
      const tenantId = typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant
      expect(tenantId).toBe(tenantA.id)
    }
  })

  it('scopes the per-tenant globals (site-settings / home-page)', async () => {
    const settings = await payload.find({ collection: 'site-settings', overrideAccess: false, user: adminA, limit: 100 })
    expect(settings.docs.length).toBe(1)
    const tenantId = typeof settings.docs[0].tenant === 'object' ? settings.docs[0].tenant?.id : settings.docs[0].tenant
    expect(tenantId).toBe(tenantA.id)
  })

  it('isolation is symmetric — B cannot read A either', async () => {
    await expect(
      payload.findByID({ collection: 'services', id: aServiceId, overrideAccess: false, user: adminB }),
    ).rejects.toThrow()
    const { docs } = await payload.find({ collection: 'services', overrideAccess: false, user: adminB, limit: 100 })
    expect(docs.map((d) => d.id)).not.toContain(aServiceId)
  })

  it('a tenant admin authenticates but is still scoped to their own tenant', async () => {
    // "Logging in" yields a user whose access is confined to their tenant — even if
    // they then hit another tenant's admin URL, the data simply isn't theirs to see.
    const { user } = await payload.login({
      collection: 'users',
      data: { email: adminA.email, password: 'test-password-123' },
    })
    expect(user).toBeTruthy()
    const asUser = await payload.find({ collection: 'services', overrideAccess: false, user, limit: 100 })
    for (const doc of asUser.docs) {
      const tenantId = typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant
      expect(tenantId).toBe(tenantA.id)
    }
  })

  it('scopes ANONYMOUS public API reads to the request host\'s tenant', async () => {
    // The raw REST/GraphQL API: an unauthenticated read must be confined to the tenant
    // that owns the request hostname — never able to list across tenants.
    const reqFor = (host?: string, user?: User) =>
      ({ req: { payload, user, headers: new Headers(host ? { host } : {}) } }) as unknown as Parameters<typeof publicTenantRead>[0]

    // Authenticated callers defer to the multi-tenant plugin (which scopes them).
    expect(await publicTenantRead(reqFor(undefined, adminA))).toBe(true)

    // Anonymous on A's host → a filter that only ever returns A's rows (and vice versa).
    expect(await publicTenantRead(reqFor(`${tenantA.subdomain}.localhost:3000`))).toEqual({ tenant: { equals: tenantA.id } })
    expect(await publicTenantRead(reqFor(`${tenantB.subdomain}.localhost:3000`))).toEqual({ tenant: { equals: tenantB.id } })

    // An unknown host, or none at all, gets no access (not a cross-tenant dump).
    expect(await publicTenantRead(reqFor('does-not-exist.localhost:3000'))).toBe(false)
    expect(await publicTenantRead(reqFor())).toBe(false)
  })

  it('blocks ANONYMOUS direct API creation of an enquiry (no tenant spoofing)', async () => {
    // A malicious direct POST cannot insert a lead — even into its "own" tenant, let alone
    // pick another tenant's id. Public submissions only flow through the server action.
    await expect(
      payload.create({
        collection: 'enquiries',
        data: { tenant: tenantB.id, name: 'spoof', phone: '07000000000', status: 'new', source: 'website' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('each tenant CAN fully manage their own content (edits are independent)', async () => {
    await payload.update({ collection: 'services', id: aServiceId, data: { title: 'A renamed' }, overrideAccess: false, user: adminA })
    const a = await payload.findByID({ collection: 'services', id: aServiceId, overrideAccess: true })
    const b = await payload.findByID({ collection: 'services', id: bServiceId, overrideAccess: true })
    expect(a.title).toBe('A renamed')
    expect(b.title).not.toBe('A renamed') // B untouched by A's edit
  })
})
