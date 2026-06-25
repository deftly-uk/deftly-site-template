/**
 * Pure hostname → tenant-subdomain helpers (no Next/Payload imports), so they are safe to
 * use anywhere — including inside Payload access functions, which run in the config graph.
 *
 * `ROOT_DOMAIN` (default `localhost`) is the apex the tenant subdomains hang off; the
 * first label of `<sub>.<ROOT_DOMAIN>` is the tenant subdomain. A bare apex or `www`
 * returns null (no tenant), as does a host that is not under the configured root (those
 * are custom domains, resolved separately).
 */

export const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || 'localhost').toLowerCase()

/** Strip the port and lowercase a Host header value. */
export const normaliseHost = (host: string): string => host.split(':')[0]!.trim().toLowerCase()

/** Extract the tenant subdomain from a host, or null if this is the apex / unknown. */
export const extractSubdomain = (rawHost: string | null | undefined): string | null => {
  if (!rawHost) return null
  const host = normaliseHost(rawHost)
  if (!host || host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return null

  // <sub>.<ROOT_DOMAIN> → sub (supports nested labels in custom roots).
  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = host.slice(0, -(ROOT_DOMAIN.length + 1))
    const first = sub.split('.')[0]!
    return first === 'www' || first === '' ? null : first
  }

  // Not under the configured root: treat as a custom domain (resolved separately).
  return null
}
