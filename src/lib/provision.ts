import type { Payload } from 'payload'

import type { Tenant, User } from '@/payload-types'

/**
 * Tenant provisioning primitives (Stage 1).
 *
 * The single, idempotent way to create a tenant and its content. Reused by the demo
 * seed, the Stage 2 spec loader, and the Stage 3 build worker — so "create a site" has
 * exactly one implementation and re-running it never duplicates rows.
 *
 * Everything runs with `overrideAccess: true`: provisioning is a trusted system action
 * (the seed, the worker), not a user request, so it is not itself tenant-scoped — but
 * every row it writes IS tagged with its tenant, which is what enforces isolation for
 * everyone else.
 */

export type TenantIndustry = NonNullable<Tenant['industry']>
export type TenantStatus = NonNullable<Tenant['status']>

export type TenantInput = {
  name: string
  subdomain: string
  industry?: TenantIndustry
  status?: TenantStatus
  customDomain?: string | null
}

/**
 * Create or update a tenant, keyed by its (unique) subdomain.
 *
 * Rebuild-safe (ADR 0001): on UPDATE we refresh only the spec-derived labels (`name`,
 * `industry`). We deliberately do NOT touch `status` or `customDomain` here, because those
 * are live routing / lifecycle metadata the platform owns out-of-band: a rebuild that
 * blindly rewrote them would clear an attached custom domain (taking that site offline) or
 * reset a live tenant's status (downgrading an active site, or un-suspending a suspended
 * one). They are set on CREATE and changed elsewhere, never by a rebuild.
 */
export const upsertTenant = async (payload: Payload, input: TenantInput): Promise<Tenant> => {
  const subdomain = input.subdomain.trim().toLowerCase()
  const existing = await payload.find({
    collection: 'tenants',
    where: { subdomain: { equals: subdomain } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    const data: Record<string, unknown> = { name: input.name }
    if (input.industry !== undefined) data.industry = input.industry
    return payload.update({
      collection: 'tenants',
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    }) as Promise<Tenant>
  }

  return payload.create({
    collection: 'tenants',
    data: {
      name: input.name,
      subdomain,
      industry: input.industry ?? 'plumber',
      status: input.status ?? 'pending',
      customDomain: input.customDomain ?? null,
    },
    overrideAccess: true,
  }) as Promise<Tenant>
}

export type TenantAdminInput = {
  tenantId: number
  email: string
  password: string
  name?: string
  isSuperAdmin?: boolean
}

/**
 * Create or update a tenant admin, keyed by email. Guarantees the user is a member of
 * the given tenant (the `tenants` array the multi-tenant plugin scopes access by). An
 * existing user gains the tenant without losing any they already had.
 */
export const upsertTenantAdmin = async (payload: Payload, input: TenantAdminInput): Promise<User> => {
  const email = input.email.trim().toLowerCase()
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    const current = existing.docs[0] as User
    const tenantIds = new Set<number>(
      (current.tenants ?? []).map((row) =>
        typeof row.tenant === 'object' ? row.tenant.id : row.tenant,
      ),
    )
    tenantIds.add(input.tenantId)
    // Promote an existing user to platform operator when asked (e.g. the known admin
    // after the multi-tenant migration left everyone is_super_admin=false). Only ever
    // promote here — never silently demote an existing super admin.
    const promote = input.isSuperAdmin && !current.isSuperAdmin
    return payload.update({
      collection: 'users',
      id: current.id,
      data: {
        tenants: [...tenantIds].map((tenant) => ({ tenant })),
        ...(promote ? { isSuperAdmin: true } : {}),
      },
      overrideAccess: true,
    }) as Promise<User>
  }

  return payload.create({
    collection: 'users',
    data: {
      email,
      password: input.password,
      name: input.name,
      isSuperAdmin: Boolean(input.isSuperAdmin),
      tenants: [{ tenant: input.tenantId }],
    },
    overrideAccess: true,
  }) as Promise<User>
}

/**
 * Ensure the single per-tenant "global" row (site-settings or home-page) exists.
 *
 * Additive-safe (rebuild MVP, ADR 0001): if the row already exists it is **left untouched**,
 * so a rebuild can never overwrite a customer's edits to their settings or home page. The
 * spec only seeds the row on first build. The full "spec keeps updating untouched fields"
 * behaviour is the Phase 2 ownership model.
 */
export const upsertTenantGlobal = async (
  payload: Payload,
  collection: 'site-settings' | 'home-page',
  tenantId: number,
  data: Record<string, unknown>,
): Promise<void> => {
  const existing = await payload.find({
    collection,
    where: { tenant: { equals: tenantId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs[0]) return // additive-safe: never overwrite an existing per-tenant global
  const payloadData = { ...data, tenant: tenantId }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.create({ collection, data: payloadData, overrideAccess: true } as any)
}

/**
 * Ensure a tenant-scoped content row exists, keyed by tenant + a match field.
 *
 * Additive-safe (rebuild MVP, ADR 0001): if a matching row already exists it is **left
 * untouched**; only genuinely new items are created. A rebuild therefore never overwrites
 * or deletes existing content. Trade-off: a renamed/removed item lingers until tidied by
 * hand (Phase 2's ownership model reconciles those cleanly).
 */
export const upsertTenantDoc = async (
  payload: Payload,
  collection: 'services' | 'testimonials',
  tenantId: number,
  matchField: string,
  matchValue: string,
  data: Record<string, unknown>,
): Promise<void> => {
  const existing = await payload.find({
    collection,
    where: { and: [{ tenant: { equals: tenantId } }, { [matchField]: { equals: matchValue } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs[0]) return // additive-safe: never overwrite existing content
  const payloadData = { ...data, tenant: tenantId }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.create({ collection, data: payloadData, overrideAccess: true } as any)
}

/** A full tenant content bundle: the two globals plus the list collections. */
export type TenantContent = {
  siteSettings: Record<string, unknown>
  homePage: Record<string, unknown>
  services: Array<Record<string, unknown> & { title: string }>
  testimonials: Array<Record<string, unknown> & { authorName: string }>
}

/** Write a whole content bundle for a tenant (idempotent). */
export const provisionTenantContent = async (
  payload: Payload,
  tenantId: number,
  content: TenantContent,
): Promise<void> => {
  await upsertTenantGlobal(payload, 'site-settings', tenantId, content.siteSettings)
  await upsertTenantGlobal(payload, 'home-page', tenantId, content.homePage)
  for (const service of content.services) {
    await upsertTenantDoc(payload, 'services', tenantId, 'title', service.title, service)
  }
  for (const testimonial of content.testimonials) {
    await upsertTenantDoc(payload, 'testimonials', tenantId, 'authorName', testimonial.authorName, testimonial)
  }
}
