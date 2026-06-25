import type { Pool } from 'pg'
import type { Payload } from 'payload'

import { loadTenantFromSpec } from '@/lib/spec/load-tenant'
import { safeParseSiteSpec } from '@/lib/spec/schema'
import type { Tenant } from '@/payload-types'

import {
  claimNextBuildJob,
  markBuildJobFailed,
  markBuildJobReady,
  type BuildJob,
} from './build-jobs'

/**
 * The builder (Stage 3). Claims a queued build job, creates the tenant + loads its
 * content from the job's spec, and advances the job queued → building → ready (or
 * → failed with the reason). Claiming is safe against double-processing (see
 * claimNextBuildJob). The preview URL is a placeholder for now — real preview/deploy is
 * the later live step (explicitly out of scope here).
 */

/** Derive a stable, valid subdomain from the business name + the job id. */
export const subdomainForJob = (businessName: string, jobId: string): string => {
  const slug = businessName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36)
    .replace(/-+$/g, '')
  const suffix = jobId.replace(/[^a-z0-9]/g, '').slice(0, 6)
  return `${slug || 'site'}-${suffix}`
}

/** The preview URL the engine records (placeholder until real preview/deploy lands). */
export const previewUrlFor = (subdomain: string, baseDomain = process.env.PREVIEW_BASE_DOMAIN || 'preview.deftly.app'): string =>
  `https://${subdomain}.${baseDomain}`

export type BuildOutcome =
  | { claimed: false }
  | { claimed: true; status: 'ready'; job: BuildJob; tenant: Tenant; siteUrl: string }
  | { claimed: true; status: 'failed'; job: BuildJob; error: string }

/**
 * Claim and process a single build job end to end. Returns `{ claimed: false }` when the
 * queue is empty. Never throws on a build failure — it records it on the job and returns
 * a `failed` outcome, so the queue is the single source of truth for what happened.
 */
export const runBuildOnce = async (payload: Payload, pool: Pool): Promise<BuildOutcome> => {
  const job = await claimNextBuildJob(pool)
  if (!job) return { claimed: false }

  try {
    // Validate up front so a bad spec fails loudly with a useful reason on the job.
    const parsed = safeParseSiteSpec(job.spec)
    if (!parsed.success) {
      throw new Error(`Invalid spec: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`)
    }

    const subdomain = subdomainForJob(parsed.data.identity.businessName, job.id)
    const { tenant } = await loadTenantFromSpec(payload, parsed.data, { subdomain, status: 'pending' })
    const siteUrl = previewUrlFor(subdomain)

    await markBuildJobReady(pool, job.id, siteUrl)
    return { claimed: true, status: 'ready', job, tenant, siteUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    payload.logger?.error?.(`Build job ${job.id} failed: ${message}`)
    await markBuildJobFailed(pool, job.id, message)
    return { claimed: true, status: 'failed', job, error: message }
  }
}

/**
 * Drain the queue: process jobs until it's empty (or `max` is hit). Returns every
 * outcome. A simple loop is enough for the engine; real scheduling/retry backoff is a
 * later concern.
 */
export const drainBuildQueue = async (payload: Payload, pool: Pool, max = 100): Promise<BuildOutcome[]> => {
  const outcomes: BuildOutcome[] = []
  for (let i = 0; i < max; i++) {
    const outcome = await runBuildOnce(payload, pool)
    if (!outcome.claimed) break
    outcomes.push(outcome)
  }
  return outcomes
}
