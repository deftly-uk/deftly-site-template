import { NextResponse, type NextRequest } from 'next/server'

/**
 * Path-based tenant preview routing + override-header hardening.
 *
 * Today every built site is reachable at `<engine-domain>/s/<subdomain>` (PATH mode, see
 * worker.previewUrlFor) because we don't yet have a wildcard `*.deftly.uk` pointed at the
 * engine. This middleware turns `/s/<sub>/...` into a normal tenant request: it rewrites to
 * the underlying route and sets the trusted `x-tenant-subdomain` header that
 * `getRequestTenant` honours when ALLOW_TENANT_HEADER_OVERRIDE=true.
 *
 * Security: that override header lets a caller force any tenant, so we must never trust one
 * arriving from the public internet. We STRIP any inbound `x-tenant-subdomain` on every
 * request, then set it ourselves only for `/s/:sub` paths. So with the override flag on,
 * the only value the app ever sees is the one this middleware derived from the URL path —
 * a spoofed header on a normal request is dropped.
 *
 * Once a wildcard domain lands, drop PREVIEW_PATH_BASE (back to subdomain URLs) and this
 * middleware becomes a no-op rewrite layer; the header-strip stays as defence-in-depth.
 */
const SUB_RE = /^\/s\/([a-z0-9-]+)(\/.*)?$/i

export function middleware(req: NextRequest): NextResponse {
  // Start from the incoming headers but remove any client-supplied tenant override.
  const headers = new Headers(req.headers)
  headers.delete('x-tenant-subdomain')

  const match = SUB_RE.exec(req.nextUrl.pathname)
  if (match) {
    const sub = match[1]!.toLowerCase()
    const rest = match[2] && match[2] !== '/' ? match[2] : '/'
    headers.set('x-tenant-subdomain', sub)
    const url = req.nextUrl.clone()
    url.pathname = rest
    return NextResponse.rewrite(url, { request: { headers } })
  }

  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|woff2?)).*)'],
}
