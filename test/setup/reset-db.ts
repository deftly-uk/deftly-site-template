import { Client } from 'pg'

/**
 * vitest globalSetup — wipe the throwaway test database to a clean schema before the
 * suite, so Payload pushes fresh tables and no rows survive between runs. Runs once.
 */
export default async function setup(): Promise<void> {
  const connectionString =
    process.env.TEST_DATABASE_URI || 'postgresql://postgres:postgres@localhost:55432/deftly_test'
  const client = new Client({ connectionString })
  await client.connect()
  await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;')
  await client.end()
}
