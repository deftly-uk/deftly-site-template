import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Integration tests run the real Payload Local API against a throwaway Postgres
 * (see scripts/with-test-db.mjs). Schema is pushed straight from payload.config.ts
 * (PAYLOAD_DB_PUSH=true) so tests never depend on committed migrations, and there is
 * NO Blob token, so media uploads use local disk only — code-only, as required.
 *
 * One fork, no file parallelism: a single Payload instance + one schema push shared by
 * every test file. Tenant scoping (not an empty DB) is what keeps tests independent.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/setup/reset-db.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: {
      POSTGRES_URL: process.env.TEST_DATABASE_URI || 'postgresql://postgres:postgres@localhost:55432/deftly_test',
      DATABASE_URI: process.env.TEST_DATABASE_URI || 'postgresql://postgres:postgres@localhost:55432/deftly_test',
      // The shared build queue lives on the control plane (the CRM's DB). In production
      // that's a separate Supabase project; in tests we point it at the same throwaway
      // Postgres so the queue lifecycle is exercised end to end without a second DB.
      CONTROL_PLANE_DATABASE_URL: process.env.TEST_DATABASE_URI || 'postgresql://postgres:postgres@localhost:55432/deftly_test',
      PAYLOAD_SECRET: 'test-secret-not-real',
      PAYLOAD_DB_PUSH: 'true',
      NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
      ROOT_DOMAIN: 'localhost',
    },
  },
  resolve: {
    alias: {
      '@payload-config': fileURLToPath(new URL('./src/payload.config.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
