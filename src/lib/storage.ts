/**
 * Storage pathing (Stage 1).
 *
 * One shared object store, namespaced per tenant: every uploaded file is stored
 * under `tenants/<subdomain>/...`. In production this prefix is consumed by the
 * Vercel Blob adapter (it reads the upload's `prefix` field); in tests there is no
 * Blob (local disk only), and we assert the prefix VALUE is set correctly per tenant.
 *
 * This is defence-in-depth on top of the database-level tenant isolation: even the
 * raw storage keys for two tenants can never collide or be guessed across tenants.
 */

/** Whether the real Vercel Blob store is configured (prod). Tests run without it. */
export const blobEnabled = (): boolean => Boolean(process.env.BLOB_READ_WRITE_TOKEN)

/** The per-tenant storage prefix for a given tenant subdomain. */
export const tenantMediaPrefix = (subdomain: string): string => `tenants/${subdomain}`
