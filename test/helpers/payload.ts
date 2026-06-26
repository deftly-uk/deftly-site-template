import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'
import type { Tenant, User } from '@/payload-types'
import { upsertTenant, upsertTenantAdmin, type TenantInput } from '@/lib/provision'
import { upsertTenantImage } from '@/lib/stock-images'

/**
 * Shared test harness. One Payload instance for the whole suite (single fork), talking
 * to the throwaway Postgres. Helpers create tenants/users/media so each test focuses on
 * the property under test, not on boilerplate.
 */

let cached: Promise<Payload> | null = null

export const getTestPayload = (): Promise<Payload> => {
  if (!cached) cached = getPayload({ config })
  return cached
}

// Monotonic suffix so parallel-looking tests never collide on the unique subdomain.
let counter = 0
export const uniqueSub = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${counter++}`

export const makeTenant = async (payload: Payload, input: Partial<TenantInput> & { subdomain: string }): Promise<Tenant> =>
  upsertTenant(payload, { name: input.name ?? input.subdomain, status: 'active', ...input })

export const makeTenantAdmin = async (
  payload: Payload,
  tenantId: number,
  opts: { email: string; password?: string; isSuperAdmin?: boolean },
): Promise<User> =>
  upsertTenantAdmin(payload, {
    tenantId,
    email: opts.email,
    password: opts.password ?? 'test-password-123',
    name: opts.email,
    isSuperAdmin: opts.isSuperAdmin,
  })

/** Create a tenant-scoped media row with a real (tiny) generated image on local disk. */
export const makeMedia = async (payload: Payload, tenantId: number, filename: string): Promise<number> =>
  upsertTenantImage(payload, tenantId, {
    filename,
    alt: 'test image',
    width: 64,
    height: 48,
    variant: 'hero',
  })

/** Minimal valid site-settings/home-page/service/enquiry for a tenant. */
export const seedMinimalContent = async (payload: Payload, tenantId: number, label: string): Promise<void> => {
  await payload.create({
    collection: 'site-settings',
    data: { tenant: tenantId, businessName: `${label} Ltd`, phone: '01234567890' },
    overrideAccess: true,
  })
  await payload.create({
    collection: 'home-page',
    data: { tenant: tenantId, heroHeadline: `${label} hero` },
    overrideAccess: true,
  })
  await payload.create({
    collection: 'services',
    data: { tenant: tenantId, title: `${label} service`, summary: 'a service' },
    overrideAccess: true,
  })
  await payload.create({
    collection: 'enquiries',
    data: { tenant: tenantId, name: `${label} lead`, phone: '07000000000', status: 'new', source: 'website' },
    overrideAccess: true,
  })
}
