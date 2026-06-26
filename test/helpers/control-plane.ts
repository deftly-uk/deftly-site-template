import type { Pool } from 'pg'

/**
 * TEST-ONLY fixture for the shared control-plane queue.
 *
 * In every real environment the `build_jobs` queue lives in the CRM's Supabase "deftly"
 * database and is created by the CRM migration
 * (deftly-app/supabase/migrations/0006_build_queue.sql) — the engine never creates it.
 *
 * Tests run against a throwaway Postgres that has no CRM migrations applied, so we stand
 * up a table of the SAME shape here. The cross-database foreign keys (lead_id → leads,
 * spec_id → lead_specs, created_by → users) are intentionally omitted: those tables live
 * in the CRM control plane, not here. `updated_at` is maintained explicitly by every
 * queue UPDATE (see build-jobs.ts), so no trigger is needed either.
 *
 * Keep the column list in sync with 0006_build_queue.sql.
 */
export const ensureControlPlaneSchema = async (pool: Pool): Promise<void> => {
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
