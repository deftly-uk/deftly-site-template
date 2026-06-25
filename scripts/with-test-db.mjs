#!/usr/bin/env node
/**
 * Self-contained test runner: boot a throwaway Postgres in Docker, run vitest against
 * it, tear it down. No external services, no real database — code-only, as required.
 *
 *   npm test                 # ephemeral DB, run + clean up
 *   KEEP_TEST_DB=1 npm test  # leave the container running for debugging
 *   TEST_DATABASE_URI=... npm test   # use an existing Postgres, skip Docker
 */
import { spawn, spawnSync } from 'node:child_process'

const CONTAINER = 'deftly-engine-test-pg'
const PORT = process.env.TEST_DB_PORT || '55432'
const URI = process.env.TEST_DATABASE_URI || `postgresql://postgres:postgres@localhost:${PORT}/deftly_test`
const usingExternal = Boolean(process.env.TEST_DATABASE_URI)

const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts })
const log = (m) => process.stdout.write(`[test-db] ${m}\n`)

function dockerUp() {
  if (run('docker', ['info']).status !== 0) {
    console.error('[test-db] Docker is not running. Start Docker, or set TEST_DATABASE_URI to a Postgres you control.')
    process.exit(1)
  }
}

function startContainer() {
  run('docker', ['rm', '-f', CONTAINER])
  log(`starting Postgres 16 on :${PORT}`)
  const res = run('docker', [
    'run', '-d', '--name', CONTAINER,
    '-e', 'POSTGRES_PASSWORD=postgres', '-e', 'POSTGRES_USER=postgres', '-e', 'POSTGRES_DB=deftly_test',
    '-p', `${PORT}:5432`, 'postgres:16-alpine',
  ])
  if (res.status !== 0) {
    console.error('[test-db] failed to start container:\n' + res.stderr)
    process.exit(1)
  }
  for (let i = 0; i < 60; i++) {
    if (run('docker', ['exec', CONTAINER, 'pg_isready', '-U', 'postgres']).status === 0) {
      log(`ready after ~${i}s`)
      return
    }
    spawnSync('sleep', ['1'])
  }
  console.error('[test-db] Postgres did not become ready in time')
  stopContainer()
  process.exit(1)
}

function stopContainer() {
  if (usingExternal || process.env.KEEP_TEST_DB) return
  run('docker', ['rm', '-f', CONTAINER])
  log('container removed')
}

if (!usingExternal) {
  dockerUp()
  startContainer()
} else {
  log(`using external database from TEST_DATABASE_URI`)
}

const vitest = spawn('npx', ['vitest', 'run'], {
  stdio: 'inherit',
  env: { ...process.env, TEST_DATABASE_URI: URI },
})

vitest.on('exit', (code) => {
  stopContainer()
  process.exit(code ?? 1)
})
