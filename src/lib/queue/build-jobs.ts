import { Pool } from 'pg'

/**
 * The shared build queue (Stage 3) — ONE queue across two systems.
 *
 * `build_jobs` is the single queue the CRM writes and the engine reads. Its canonical
 * definition lives in the CRM repo (deftly-app/supabase/migrations/0006_build_queue.sql)
 * inside the shared CONTROL-PLANE database (the CRM's Supabase "deftly" project). It is
 * NOT a Payload collection and it does NOT live in this engine's own (Neon) content DB.
 *
 * Connection split (the whole point of this module):
 *   - Tenant *content* → the engine's own DB via POSTGRES_URL (Payload).
 *   - The build *queue* → the control plane via CONTROL_PLANE_DATABASE_URL (this module).
 * Pointing the queue at the CRM's DB is what makes "rep marks Interested" actually reach
 * the engine, and lets the worker write status + site_url back to the row the CRM shows.
 *
 * This engine never CREATEs the queue table in any real environment — the CRM migration
 * owns it. Tests run against a throwaway Postgres that has no CRM migrations, so they
 * stand the table up with a TEST-ONLY fixture (test/helpers/control-plane.ts) that mirrors
 * the canonical shape (minus the cross-DB foreign keys, which point at CRM-only tables).
 *
 * Lifecycle:  queued → building → ready
 *                              └→ failed → (re-trigger) → queued
 */

export type BuildJobStatus = 'queued' | 'building' | 'ready' | 'failed'

export type BuildJob = {
  id: string
  lead_id: string | null
  spec_id: string | null
  spec_version: number
  spec: unknown
  status: BuildJobStatus
  error: string | null
  site_url: string | null
  attempts: number
  queued_at: string
  started_at: string | null
  ready_at: string | null
  failed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * A pg Pool connected to the CONTROL-PLANE database (the CRM's Supabase "deftly"
 * project), where the shared `build_jobs` queue lives. This is deliberately a different
 * connection from the engine's own content DB (POSTGRES_URL / Payload): the queue is
 * shared, the tenant content is not.
 *
 * There is NO fallback to POSTGRES_URL on purpose — silently running the queue against
 * the engine's own DB is exactly the split-brain bug this change fixes, so a missing
 * CONTROL_PLANE_DATABASE_URL fails loudly. The Supabase connection string must enable SSL
 * (append `?sslmode=require`); in tests this points at the throwaway Postgres.
 *
 * Caller owns the lifecycle (close it).
 */
export const createControlPlanePool = (connectionString = process.env.CONTROL_PLANE_DATABASE_URL): Pool => {
  if (!connectionString) {
    throw new Error(
      'No control-plane connection string. Set CONTROL_PLANE_DATABASE_URL to the CRM ' +
        'Supabase "deftly" database (the one that owns the shared build_jobs queue).',
    )
  }
  return new Pool({ connectionString, ssl: sslOptionFromConnectionString(connectionString) })
}

/**
 * Translate a libpq-style `?sslmode=` into a node-postgres `ssl` option.
 *
 * node-postgres does NOT interpret `sslmode` the way libpq does: a bare
 * `new Pool({ connectionString: '...sslmode=require' })` ends up doing full CA
 * verification (`rejectUnauthorized: true`), which fails against Supabase's direct host
 * (its cert is signed by Supabase's own CA, not in Node's trust store) — so the worker
 * could never connect and the queue would never drain. We map sslmode explicitly:
 *   - require / prefer / no-verify → encrypt, do NOT verify the chain (libpq's `require`)
 *   - verify-ca / verify-full      → encrypt AND verify
 *   - disable / allow / (absent)   → no SSL (local test Postgres is plaintext)
 * Returns `false` (SSL off) when there is no sslmode, so the local Docker test DB keeps
 * working unchanged.
 */
const sslOptionFromConnectionString = (cs: string): { rejectUnauthorized: boolean } | false => {
  const match = /[?&]sslmode=([^&]+)/i.exec(cs)
  if (!match) return false
  const mode = decodeURIComponent(match[1]).toLowerCase()
  if (mode === 'disable' || mode === 'allow') return false
  return { rejectUnauthorized: mode === 'verify-ca' || mode === 'verify-full' }
}

/** Enqueue a job (in production the CRM does this; here it's used by tests/seeds). */
export const enqueueBuildJob = async (
  pool: Pool,
  input: { spec: unknown; specVersion: number; leadId?: string | null; specId?: string | null },
): Promise<BuildJob> => {
  const { rows } = await pool.query<BuildJob>(
    `insert into build_jobs (lead_id, spec_id, spec_version, spec, status)
     values ($1, $2, $3, $4::jsonb, 'queued')
     returning *`,
    [input.leadId ?? null, input.specId ?? null, input.specVersion, JSON.stringify(input.spec)],
  )
  return rows[0]
}

/**
 * Atomically claim the oldest queued job. `FOR UPDATE SKIP LOCKED` guarantees two
 * workers can never grab the same job: the second worker's row is locked, so it is
 * skipped and the worker simply gets nothing. Stamps started_at (attempts is bumped on
 * re-trigger, not on claim — matching the CRM shape).
 */
export const claimNextBuildJob = async (pool: Pool): Promise<BuildJob | null> => {
  const { rows } = await pool.query<BuildJob>(`
    update build_jobs
       set status = 'building', started_at = now(), updated_at = now()
     where id = (
       select id from build_jobs
        where status = 'queued'
        order by queued_at
        for update skip locked
        limit 1
     )
     returning *
  `)
  return rows[0] ?? null
}

/**
 * Recover stranded jobs. A worker that crashes after claiming a job leaves it in
 * `building` forever — no heartbeat, no timeout, so it never runs again. This requeues
 * any `building` job whose `started_at` is older than `staleMs` (default 15 min), bumping
 * `attempts` so a perpetually-crashing job is still visible. Safe to call before every
 * claim; healthy in-flight builds (recent `started_at`) are untouched. Returns the number
 * of jobs requeued.
 */
export const recoverStaleBuildJobs = async (
  pool: Pool,
  staleMs = Number(process.env.BUILD_JOB_STALE_MS) || 15 * 60 * 1000,
): Promise<number> => {
  const { rowCount } = await pool.query(
    `update build_jobs
        set status = 'queued', started_at = null,
            attempts = attempts + 1, updated_at = now()
      where status = 'building'
        and started_at < now() - ($1::bigint * interval '1 millisecond')`,
    [Math.max(0, Math.floor(staleMs))],
  )
  return rowCount ?? 0
}

/** Mark a claimed job ready, recording the preview/live URL the engine produced. */
export const markBuildJobReady = async (pool: Pool, id: string, siteUrl: string): Promise<void> => {
  await pool.query(
    `update build_jobs set status = 'ready', site_url = $2, ready_at = now(), error = null, updated_at = now() where id = $1`,
    [id, siteUrl],
  )
}

/** Mark a claimed job failed, recording why (re-triggerable back to queued). */
export const markBuildJobFailed = async (pool: Pool, id: string, error: string): Promise<void> => {
  await pool.query(
    `update build_jobs set status = 'failed', error = $2, failed_at = now(), updated_at = now() where id = $1`,
    [id, error.slice(0, 4000)],
  )
}

/** Re-queue a failed job (the re-trigger path). Bumps attempts. */
export const retriggerBuildJob = async (pool: Pool, id: string): Promise<void> => {
  await pool.query(
    `update build_jobs
        set status = 'queued', error = null, started_at = null, failed_at = null,
            attempts = attempts + 1, updated_at = now()
      where id = $1 and status = 'failed'`,
    [id],
  )
}

export const getBuildJob = async (pool: Pool, id: string): Promise<BuildJob | null> => {
  const { rows } = await pool.query<BuildJob>(`select * from build_jobs where id = $1`, [id])
  return rows[0] ?? null
}
