import { Pool } from 'pg'

/**
 * The shared build queue (Stage 3).
 *
 * `build_jobs` is the ONE queue the CRM writes and the engine reads — its canonical
 * definition lives in the CRM repo (deftly-app/supabase/migrations/0006_build_queue.sql)
 * inside the shared control-plane database. It is NOT a Payload collection: it is plain
 * SQL the two systems share. For this code-only run we create a local table of the same
 * shape and drive its lifecycle.
 *
 * Foreign keys to leads/lead_specs/users are intentionally dropped here: those tables
 * live in the CRM control-plane, not in this engine's local DB. The columns are kept so
 * the shape matches exactly.
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

/** A pg Pool from the standard Postgres env. Caller owns the lifecycle (close it). */
export const createPool = (connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URI): Pool => {
  if (!connectionString) throw new Error('No Postgres connection string (POSTGRES_URL / DATABASE_URI).')
  return new Pool({ connectionString })
}

/** Create the build_jobs table if it doesn't exist (mirrors the CRM shape). */
export const ensureBuildJobsTable = async (pool: Pool): Promise<void> => {
  await pool.query(`
    create table if not exists build_jobs (
      id           uuid primary key default gen_random_uuid(),
      lead_id      uuid,
      spec_id      uuid,
      spec_version integer not null,
      spec         jsonb not null,
      status       text not null default 'queued'
                     check (status in ('queued','building','ready','failed')),
      error        text,
      site_url     text,
      attempts     integer not null default 1,
      queued_at    timestamptz not null default now(),
      started_at   timestamptz,
      ready_at     timestamptz,
      failed_at    timestamptz,
      created_at   timestamptz not null default now(),
      updated_at   timestamptz not null default now()
    );
    create index if not exists idx_build_jobs_status_queued on build_jobs (status, queued_at);
  `)
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
