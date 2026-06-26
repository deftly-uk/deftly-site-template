import { timingSafeEqual } from 'node:crypto'
import { after, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

import { createControlPlanePool } from '@/lib/queue/build-jobs'
import { drainBuildQueue, type BuildOutcome } from '@/lib/queue/worker'

/**
 * Protected build-worker trigger (Stage 4 — self-serve loop).
 *
 * POST here to drain the shared build queue: claim queued jobs, build each tenant, mark
 * ready + email the link. Two callers in production:
 *   1. the CRM, the instant a rep saves an Interested intake (on-enqueue nudge), and
 *   2. a low-frequency external scheduler (backstop, in case a nudge is missed).
 * Both just need to kick the worker, so by default we ACK immediately (202) and drain in
 * the background via `after()` — the request returns fast while the build runs to the
 * function's maxDuration.
 *
 * `?wait=1` drains synchronously and returns the outcomes (used by the end-to-end test so
 * the result — including whether the email sent — is deterministic).
 *
 * Auth: `Authorization: Bearer <WORKER_TRIGGER_SECRET>` (or `x-worker-secret: <secret>`).
 * The queue claim is `FOR UPDATE SKIP LOCKED`, so overlapping triggers are safe — no job
 * is ever built (or emailed) twice.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_PER_RUN = Number(process.env.WORKER_MAX_PER_RUN) || 5

const safeEqual = (a: string, b: string): boolean => {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

const authorized = (req: NextRequest): boolean => {
  const secret = process.env.WORKER_TRIGGER_SECRET
  if (!secret) return false
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const header = req.headers.get('x-worker-secret')?.trim()
  const presented = bearer || header || ''
  return presented.length > 0 && safeEqual(presented, secret)
}

const summarise = (outcomes: BuildOutcome[]) =>
  outcomes.map((o) => {
    if (!o.claimed) return { claimed: false }
    if (o.status === 'ready')
      return {
        claimed: true,
        status: 'ready',
        jobId: o.job.id,
        siteUrl: o.siteUrl,
        emailed: o.email.sent,
        emailTo: o.email.to,
        emailReason: o.email.sent ? undefined : o.email.reason,
      }
    return { claimed: true, status: 'failed', jobId: o.job.id, error: o.error }
  })

const drain = async (): Promise<BuildOutcome[]> => {
  const payload = await getPayload({ config })
  const pool = createControlPlanePool()
  try {
    return await drainBuildQueue(payload, pool, MAX_PER_RUN)
  } finally {
    await pool.end()
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  if (!process.env.WORKER_TRIGGER_SECRET) {
    return Response.json({ ok: false, error: 'WORKER_TRIGGER_SECRET not configured' }, { status: 503 })
  }
  // Fail loudly instead of ACKing a drain that can't run: without the queue connection the
  // background drain would throw and only console.error, leaving the caller thinking it
  // succeeded while nothing builds.
  if (!process.env.CONTROL_PLANE_DATABASE_URL) {
    return Response.json({ ok: false, error: 'CONTROL_PLANE_DATABASE_URL not configured' }, { status: 503 })
  }
  if (!authorized(req)) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const wait = req.nextUrl.searchParams.get('wait')
  if (wait === '1' || wait === 'true') {
    try {
      const outcomes = await drain()
      return Response.json({ ok: true, mode: 'sync', processed: outcomes.length, outcomes: summarise(outcomes) })
    } catch (err) {
      return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
  }

  // Fire-and-forget: ACK now, keep the invocation alive to drain after the response.
  after(async () => {
    try {
      await drain()
    } catch (err) {
      console.error('[run-worker] background drain failed:', err)
    }
  })
  return Response.json({ ok: true, mode: 'async', accepted: true }, { status: 202 })
}
