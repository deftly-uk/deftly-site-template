import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Pool } from 'pg'
import type { Payload } from 'payload'

import { SPEC_VERSION, type SiteSpecInput } from '@/lib/spec/schema'
import { PLUMBER_SAMPLE_SPEC } from '@/lib/spec/sample-plumber'
import {
  claimNextBuildJob,
  createPool,
  enqueueBuildJob,
  ensureBuildJobsTable,
  getBuildJob,
  recoverStaleBuildJobs,
  retriggerBuildJob,
} from '@/lib/queue/build-jobs'
import { drainBuildQueue, runBuildOnce, subdomainForJob } from '@/lib/queue/worker'

import { getTestPayload, uniqueSub } from './helpers/payload'

/**
 * STAGE 3 — the builder (queue reader). A queued job runs end to end against the local
 * DB: tenant created + content loaded + status reaches ready. Claiming is safe against
 * double-processing, failures are recorded (and re-triggerable), and tenant isolation
 * still holds for sites the builder created.
 */
describe('Stage 3: build worker', () => {
  let payload: Payload
  let pool: Pool

  const specWith = (overrides: Partial<{ businessName: string; notificationEmail: string }>): unknown => ({
    ...PLUMBER_SAMPLE_SPEC,
    identity: { ...PLUMBER_SAMPLE_SPEC.identity, businessName: overrides.businessName ?? PLUMBER_SAMPLE_SPEC.identity.businessName },
    contact: { ...PLUMBER_SAMPLE_SPEC.contact, notificationEmail: overrides.notificationEmail ?? PLUMBER_SAMPLE_SPEC.contact.notificationEmail },
  })

  beforeAll(async () => {
    payload = await getTestPayload()
    pool = createPool()
    await ensureBuildJobsTable(pool)
  })

  afterAll(async () => {
    await pool.end()
  })

  it('returns "not claimed" when the queue is empty', async () => {
    // Drain anything left over first, then confirm an empty queue yields nothing.
    await drainBuildQueue(payload, pool)
    const outcome = await runBuildOnce(payload, pool)
    expect(outcome.claimed).toBe(false)
  })

  it('builds a queued job end to end (queued → building → ready)', async () => {
    const email = `${uniqueSub('build')}@owner.test`
    const job = await enqueueBuildJob(pool, {
      spec: specWith({ businessName: 'Queue Test Plumbing Ltd', notificationEmail: email }),
      specVersion: SPEC_VERSION,
      leadId: null,
    })
    expect(job.status).toBe('queued')

    const outcome = await runBuildOnce(payload, pool)
    expect(outcome.claimed).toBe(true)
    if (!outcome.claimed) return
    expect(outcome.status).toBe('ready')
    if (outcome.status !== 'ready') return

    // Tenant created with the deterministic subdomain derived from name + job id.
    expect(outcome.tenant.subdomain).toBe(subdomainForJob('Queue Test Plumbing Ltd', job.id))

    // Content actually loaded.
    const services = await payload.find({ collection: 'services', where: { tenant: { equals: outcome.tenant.id } }, overrideAccess: true, limit: 100 })
    expect(services.totalDocs).toBe(4)

    // Job row reflects the full lifecycle.
    const persisted = await getBuildJob(pool, job.id)
    expect(persisted?.status).toBe('ready')
    expect(persisted?.site_url).toBe(outcome.siteUrl)
    expect(persisted?.started_at).toBeTruthy()
    expect(persisted?.ready_at).toBeTruthy()
    expect(persisted?.attempts).toBe(1)
  })

  it('claims are safe against double-processing (only one worker wins a job)', async () => {
    await enqueueBuildJob(pool, { spec: specWith({ businessName: 'Race Plumbing Ltd' }), specVersion: SPEC_VERSION })
    // Two workers race to claim from a queue with exactly one job.
    const [a, b] = await Promise.all([claimNextBuildJob(pool), claimNextBuildJob(pool)])
    const claimed = [a, b].filter(Boolean)
    expect(claimed.length).toBe(1)
    expect([a, b].filter((x) => x === null).length).toBe(1)
  })

  it('records a failure (and supports re-trigger) for an invalid spec', async () => {
    // A spec that is valid JSON but breaks the schema (services must be non-empty).
    const badSpec = { ...(PLUMBER_SAMPLE_SPEC as unknown as SiteSpecInput), services: [] }
    const job = await enqueueBuildJob(pool, { spec: badSpec, specVersion: SPEC_VERSION })

    const outcome = await runBuildOnce(payload, pool)
    expect(outcome.claimed).toBe(true)
    if (!outcome.claimed) return
    expect(outcome.status).toBe('failed')

    const failed = await getBuildJob(pool, job.id)
    expect(failed?.status).toBe('failed')
    expect(failed?.error).toMatch(/spec|services/i)
    expect(failed?.failed_at).toBeTruthy()

    // Re-trigger puts it back on the queue for another attempt.
    await retriggerBuildJob(pool, job.id)
    const requeued = await getBuildJob(pool, job.id)
    expect(requeued?.status).toBe('queued')
  })

  it('recovers a job stranded in "building" by a crashed worker', async () => {
    // Start from an empty queue so claim ordering is deterministic.
    await drainBuildQueue(payload, pool)

    // Simulate a worker that claimed a job then died: the row sits in `building`.
    const job = await enqueueBuildJob(pool, { spec: specWith({ businessName: 'Stranded Plumbing Ltd' }), specVersion: SPEC_VERSION })
    const claimed = await claimNextBuildJob(pool)
    expect(claimed?.id).toBe(job.id)
    // Back-date its start so it looks stale (older than the recovery threshold).
    await pool.query(`update build_jobs set started_at = now() - interval '30 minutes' where id = $1`, [job.id])

    const before = await getBuildJob(pool, job.id)
    expect(before?.status).toBe('building')

    const recovered = await recoverStaleBuildJobs(pool)
    expect(recovered).toBeGreaterThanOrEqual(1)

    const after = await getBuildJob(pool, job.id)
    expect(after?.status).toBe('queued')
    expect(after?.started_at).toBeNull()
    expect(after?.attempts).toBe((before?.attempts ?? 1) + 1)

    // A freshly-claimed job (recent started_at) must NOT be recovered. Remove the
    // recovered job first so this claim deterministically picks the fresh one.
    await pool.query(`delete from build_jobs where id = $1`, [job.id])
    const fresh = await enqueueBuildJob(pool, { spec: specWith({ businessName: 'Fresh Plumbing Ltd' }), specVersion: SPEC_VERSION })
    const freshClaimed = await claimNextBuildJob(pool)
    expect(freshClaimed?.id).toBe(fresh.id)
    await recoverStaleBuildJobs(pool)
    const stillBuilding = await getBuildJob(pool, fresh.id)
    expect(stillBuilding?.status).toBe('building')

    // Clean up so the later drain-based tests start from a known state.
    await pool.query(`delete from build_jobs where id = $1`, [fresh.id])
  })

  it('tenant isolation still holds for builder-created sites', async () => {
    const emailX = `${uniqueSub('iso-x')}@owner.test`
    const emailY = `${uniqueSub('iso-y')}@owner.test`
    await enqueueBuildJob(pool, { spec: specWith({ businessName: 'Isolation X Plumbing', notificationEmail: emailX }), specVersion: SPEC_VERSION })
    await enqueueBuildJob(pool, { spec: specWith({ businessName: 'Isolation Y Plumbing', notificationEmail: emailY }), specVersion: SPEC_VERSION })

    const outcomes = await drainBuildQueue(payload, pool)
    const ready = outcomes.filter((o) => o.claimed && o.status === 'ready')
    expect(ready.length).toBeGreaterThanOrEqual(2)

    // Grab the two admins the builds provisioned and prove they can't cross the streams.
    const adminX = (await payload.find({ collection: 'users', where: { email: { equals: emailX } }, overrideAccess: true })).docs[0]
    const tenantY = (await payload.find({ collection: 'tenants', where: { name: { equals: 'Isolation Y Plumbing' } }, overrideAccess: true })).docs[0]
    const yService = (await payload.find({ collection: 'services', where: { tenant: { equals: tenantY.id } }, overrideAccess: true, limit: 1 })).docs[0]

    await expect(
      payload.findByID({ collection: 'services', id: yService.id, overrideAccess: false, user: adminX }),
    ).rejects.toThrow()
  })
})
