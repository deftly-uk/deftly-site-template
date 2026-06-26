import { getPayload } from 'payload'

import config from '../payload.config'
import { createControlPlanePool } from '../lib/queue/build-jobs'
import { drainBuildQueue } from '../lib/queue/worker'

/**
 * Build-worker entrypoint. Drains the shared queue once: claims each queued job, builds
 * the tenant in the engine's own DB, and writes status + site_url back to the shared
 * queue row in the CONTROL-PLANE database (so the CRM sees building → ready). Run on a
 * schedule (cron) or on demand.
 *
 *   npm run build:worker
 *
 * The queue table is owned by the CRM migration (deftly-app 0006_build_queue.sql); this
 * worker only reads/updates it — it never creates it.
 *
 * Code-only: it produces a placeholder preview URL. Real preview/deploy is the later
 * live step.
 */
const main = async (): Promise<void> => {
  const payload = await getPayload({ config })
  const pool = createControlPlanePool()
  try {
    const outcomes = await drainBuildQueue(payload, pool)
    if (outcomes.length === 0) {
      payload.logger.info('Build queue empty — nothing to do.')
      return
    }
    for (const o of outcomes) {
      if (o.claimed && o.status === 'ready') {
        payload.logger.info(`✅ Built "${o.tenant.name}" → ${o.siteUrl} (job ${o.job.id})`)
      } else if (o.claimed && o.status === 'failed') {
        payload.logger.error(`❌ Job ${o.job.id} failed: ${o.error}`)
      }
    }
    payload.logger.info(`Processed ${outcomes.length} job(s).`)
  } finally {
    await pool.end()
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Build worker failed:', err)
    process.exit(1)
  })
