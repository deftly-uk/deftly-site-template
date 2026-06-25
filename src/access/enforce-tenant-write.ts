import type { CollectionBeforeValidateHook } from 'payload'

import { isSuperAdmin } from './tenant'

/**
 * Close the cross-tenant WRITE hole (Stage 1 isolation).
 *
 * The multi-tenant plugin scopes read/update/delete to the user's tenants, but does NOT
 * stop an authenticated tenant admin from *creating* (or moving) a row under a tenant
 * they don't belong to. This hook enforces that: a non-super user can only write rows
 * whose `tenant` is one they are a member of.
 *
 * Trusted system operations (the seed, the build worker, the public enquiry action) run
 * with `overrideAccess: true` and no `req.user`, so they are allowed to set any tenant —
 * they are the ones that legitimately provision a tenant's content.
 */
export const enforceTenantWrite: CollectionBeforeValidateHook = ({ req, data }) => {
  const user = req.user
  if (!user || isSuperAdmin(user)) return data // system/public or platform operator

  const allowed = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((user as any).tenants ?? []).map((row: any) => (typeof row.tenant === 'object' ? row.tenant?.id : row.tenant)),
  )

  const target = data?.tenant
  const targetId = target && typeof target === 'object' ? target.id : target
  if (targetId != null && !allowed.has(targetId)) {
    throw new Error('Forbidden: cannot write content for another tenant.')
  }
  return data
}
