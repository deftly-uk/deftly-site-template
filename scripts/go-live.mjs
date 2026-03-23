#!/usr/bin/env node

/**
 * go-live.mjs — Deployment automation for generated sites
 *
 * Takes a locally-generated site from "npm run build passes" to "live on Vercel
 * with CMS, database, and blob storage". Extracted from the orchestrator's
 * provisioner.js, vercel.js, and neon.js services for standalone use in
 * bespoke builds.
 *
 * Every gotcha from the Bracken deployment (002-lessons-learned-first-deployment.md)
 * is handled here.
 *
 * Usage:
 *   node scripts/go-live.mjs --project-name my-client-site
 *   node scripts/go-live.mjs --project-name my-client-site --region aws-us-east-1
 *   node scripts/go-live.mjs --project-name my-client-site --skip-seed
 *   node scripts/go-live.mjs --cleanup --neon-project-id xxx --vercel-project-id yyy
 *
 * Required env vars:
 *   VERCEL_TOKEN    — Vercel API token
 *   NEON_API_KEY    — Neon API key
 *   GITHUB_TOKEN    — GitHub personal access token (optional, for repo creation)
 */

import { existsSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const { values: args } = parseArgs({
  options: {
    'project-name': { type: 'string' },
    region: { type: 'string', default: 'aws-eu-west-2' },
    'skip-seed': { type: 'boolean', default: false },
    cleanup: { type: 'boolean', default: false },
    'neon-project-id': { type: 'string' },
    'vercel-project-id': { type: 'string' },
    'github-org': { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(`
Usage: node scripts/go-live.mjs [options]

Options:
  --project-name <name>       Project/site name (required unless --cleanup)
  --region <region>            Neon region (default: aws-eu-west-2 / London)
  --skip-seed                  Skip content seeding step
  --cleanup                    Delete infrastructure (requires --neon-project-id and/or --vercel-project-id)
  --neon-project-id <id>       Neon project ID (for --cleanup)
  --vercel-project-id <id>     Vercel project ID (for --cleanup)
  --github-org <org>           GitHub org for repo linking
  -h, --help                   Show this help
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VERCEL_API = 'https://api.vercel.com';
const NEON_API = 'https://console.neon.tech/api/v2';
const DEPLOY_POLL_INTERVAL = 10_000; // 10 seconds
const DEPLOY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function step(label) {
  console.log(`\n▸ ${label}`);
}

function ok(msg) {
  console.log(`  [ok] ${msg}`);
}

function fail(msg) {
  console.error(`  [FAIL] ${msg}`);
}

function warn(msg) {
  console.log(`  [warn] ${msg}`);
}

async function vercelFetch(path, options = {}) {
  const token = process.env.VERCEL_TOKEN;
  const response = await fetch(`${VERCEL_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vercel API error (${response.status}): ${body}`);
  }

  return response.json();
}

async function neonFetch(path, options = {}) {
  const token = process.env.NEON_API_KEY;
  const response = await fetch(`${NEON_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Neon API error (${response.status}): ${body}`);
  }

  return response.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Cleanup mode
// ---------------------------------------------------------------------------
if (args.cleanup) {
  step('Cleanup mode — deleting infrastructure');

  if (args['neon-project-id']) {
    try {
      await neonFetch(`/projects/${args['neon-project-id']}`, { method: 'DELETE' });
      ok(`Deleted Neon project: ${args['neon-project-id']}`);
    } catch (err) {
      fail(`Failed to delete Neon project: ${err.message}`);
    }
  }

  if (args['vercel-project-id']) {
    try {
      await vercelFetch(`/v9/projects/${args['vercel-project-id']}`, { method: 'DELETE' });
      ok(`Deleted Vercel project: ${args['vercel-project-id']}`);
    } catch (err) {
      fail(`Failed to delete Vercel project: ${err.message}`);
    }
  }

  if (!args['neon-project-id'] && !args['vercel-project-id']) {
    fail('Provide --neon-project-id and/or --vercel-project-id to clean up');
    process.exit(1);
  }

  console.log('\nCleanup complete.');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Validate required arguments
// ---------------------------------------------------------------------------
const projectName = args['project-name'];

if (!projectName) {
  console.error('Error: --project-name is required.\n');
  console.error('Usage: node scripts/go-live.mjs --project-name my-client-site');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 1: Validate tokens
// ---------------------------------------------------------------------------
step('Checking API tokens');

const requiredTokens = {
  VERCEL_TOKEN: 'Vercel API token — create at https://vercel.com/account/tokens',
  NEON_API_KEY: 'Neon API key — create at https://console.neon.tech/app/settings/api-keys',
};

let tokensMissing = false;

for (const [key, instructions] of Object.entries(requiredTokens)) {
  if (process.env[key]) {
    ok(key);
  } else {
    fail(`${key} is not set. ${instructions}`);
    tokensMissing = true;
  }
}

if (process.env.GITHUB_TOKEN) {
  ok('GITHUB_TOKEN (optional)');
} else {
  warn('GITHUB_TOKEN not set — will use vercel deploy instead of git push');
}

if (tokensMissing) {
  console.error('\nSet the missing tokens as environment variables and try again.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 2: Prerequisite checks
// ---------------------------------------------------------------------------
step('Running prerequisite checks');

// 2a. Git identity — Wilding lesson: 6 failed deploys because git had no
// user.name/user.email configured. Vercel rejects git-triggered deploys
// when the commit author isn't associated with a GitHub account.
try {
  const gitEmail = execSync('git config user.email', { stdio: 'pipe' }).toString().trim();
  if (gitEmail) {
    ok(`Git identity: ${gitEmail}`);
  } else {
    throw new Error('empty');
  }
} catch {
  fail('No git user.email configured. Vercel will reject git-triggered deploys.');
  console.error('\n  Fix with:');
  console.error('    git config --global user.name "your-github-username"');
  console.error('    git config --global user.email "you@example.com"');
  console.error('\n  Or auto-detect from GitHub CLI:');
  console.error('    GH_USER=$(gh api user -q \'.login\')');
  console.error('    git config --global user.name "$GH_USER"');
  console.error('    git config --global user.email "$GH_USER@users.noreply.github.com"');
  process.exit(1);
}

// 2b. npm run build
try {
  execSync('npm run build', { stdio: 'pipe', timeout: 120_000 });
  ok('Build succeeds');
} catch (err) {
  fail('npm run build failed. Fix build errors before deploying.');
  console.error(err.stderr?.toString() || err.message);
  process.exit(1);
}

// 2c. Check importMap is populated
// Bracken lesson: empty importMap = blank admin panel
const importMapPath = 'src/app/(payload)/admin/importMap.js';
if (existsSync(importMapPath)) {
  const importMapContent = readFileSync(importMapPath, 'utf-8');
  if (importMapContent.includes('export const importMap = {}')) {
    fail('importMap.js is empty — admin panel will render blank.');
    console.error('  Run: npx payload generate:importmap');
    process.exit(1);
  }
  ok('importMap populated');
} else {
  warn('importMap.js not found — may not be a Payload CMS project');
}

// 2d. Check site-content.json exists
if (existsSync('site-content.json')) {
  const content = JSON.parse(readFileSync('site-content.json', 'utf-8'));
  if (!content.settings?.businessName && !content.businessName) {
    fail('site-content.json exists but has no businessName');
    process.exit(1);
  }
  ok('site-content.json has required fields');
} else {
  warn('site-content.json not found — seeding may not work');
}

// ---------------------------------------------------------------------------
// Step 3: Create infrastructure
// ---------------------------------------------------------------------------
step('Creating Neon database');

const neonProjectName = `deftly-${projectName}`;
const neonResult = await neonFetch('/projects', {
  method: 'POST',
  body: JSON.stringify({
    project: {
      name: neonProjectName,
      region_id: args.region, // Default: aws-eu-west-2 (London)
    },
  }),
});

const neonProjectId = neonResult.project.id;
const connectionUri = neonResult.connection_uris[0]?.connection_uri;
ok(`Neon project created: ${neonProjectId} (${args.region})`);

step('Creating Vercel project');

// Bracken lesson: ALWAYS set framework to "nextjs" explicitly. Auto-detection
// breaks if the project was ever deployed as something else.
const vercelProjectBody = {
  name: projectName,
  framework: 'nextjs',
};

// Link to GitHub if org is provided and token exists
if (args['github-org'] && process.env.GITHUB_TOKEN) {
  vercelProjectBody.gitRepository = {
    repo: `${args['github-org']}/${projectName}`,
    type: 'github',
  };
}

const vercelProject = await vercelFetch('/v11/projects', {
  method: 'POST',
  body: JSON.stringify(vercelProjectBody),
});

const vercelProjectId = vercelProject.id;
ok(`Vercel project created: ${vercelProjectId}`);

// Bracken lesson: blob stores MUST be public. Access mode can't be changed after creation.
step('Creating Vercel Blob store (public access)');

const blobResult = await vercelFetch('/v1/blob/stores', {
  method: 'POST',
  body: JSON.stringify({
    name: projectName,
    projectId: vercelProjectId,
    access: 'public',
  }),
});

const blobToken = blobResult.token;
ok('Blob store created (public)');

// Bracken lesson: disable deployment protection or production returns 404/401
step('Disabling deployment protection');

await vercelFetch(`/v9/projects/${vercelProjectId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    deploymentProtection: { deployments: 'off' },
  }),
});

ok('Deployment protection disabled');

// Set env vars
step('Setting environment variables');

const payloadSecret = randomBytes(32).toString('hex');
const siteUrl = `https://${projectName}.vercel.app`;

const envVars = [
  { key: 'DATABASE_URI', value: connectionUri, target: ['production'], type: 'encrypted' },
  { key: 'PAYLOAD_SECRET', value: payloadSecret, target: ['production'], type: 'encrypted' },
  { key: 'BLOB_READ_WRITE_TOKEN', value: blobToken, target: ['production'], type: 'encrypted' },
  { key: 'NEXT_PUBLIC_SERVER_URL', value: siteUrl, target: ['production'], type: 'plain' },
];

await vercelFetch(`/v10/projects/${vercelProjectId}/env`, {
  method: 'POST',
  body: JSON.stringify(envVars),
});

ok('DATABASE_URI');
ok('PAYLOAD_SECRET');
ok('BLOB_READ_WRITE_TOKEN');
ok('NEXT_PUBLIC_SERVER_URL');

// ---------------------------------------------------------------------------
// Step 4: Deploy
// ---------------------------------------------------------------------------
step('Deploying');

let deploymentUrl;

// Try git push if GitHub remote exists, otherwise use vercel deploy
const hasGitRemote = (() => {
  try {
    const remote = execSync('git remote get-url origin', { stdio: 'pipe' }).toString().trim();
    return remote.length > 0;
  } catch {
    return false;
  }
})();

if (hasGitRemote) {
  try {
    execSync('git push origin main', { stdio: 'pipe', timeout: 60_000 });
    ok('Pushed to GitHub — Vercel will build automatically');
  } catch (err) {
    warn(`Git push failed: ${err.message}`);
    warn('Falling back to vercel deploy --prod');
    try {
      execSync(`npx vercel deploy --prod --token=${process.env.VERCEL_TOKEN}`, {
        stdio: 'pipe',
        timeout: 300_000,
      });
      ok('Deployed via Vercel CLI');
    } catch (deployErr) {
      fail(`Deploy failed: ${deployErr.message}`);
      console.error('\nInfrastructure was created. To clean up:');
      console.error(`  node scripts/go-live.mjs --cleanup --neon-project-id ${neonProjectId} --vercel-project-id ${vercelProjectId}`);
      process.exit(1);
    }
  }
} else {
  try {
    execSync(`npx vercel deploy --prod --token=${process.env.VERCEL_TOKEN}`, {
      stdio: 'pipe',
      timeout: 300_000,
    });
    ok('Deployed via Vercel CLI');
  } catch (err) {
    fail(`Deploy failed: ${err.message}`);
    console.error('\nInfrastructure was created. To clean up:');
    console.error(`  node scripts/go-live.mjs --cleanup --neon-project-id ${neonProjectId} --vercel-project-id ${vercelProjectId}`);
    process.exit(1);
  }
}

// Poll deployment status
step('Waiting for deployment to be ready');

const start = Date.now();
let deployReady = false;

while (Date.now() - start < DEPLOY_TIMEOUT) {
  try {
    // List recent deployments for the project
    const deployments = await vercelFetch(
      `/v6/deployments?projectId=${vercelProjectId}&limit=1&target=production`
    );

    const latest = deployments.deployments?.[0];
    if (latest) {
      if (latest.readyState === 'READY') {
        deployReady = true;
        deploymentUrl = `https://${latest.url}`;
        ok(`Deployment ready: ${deploymentUrl}`);
        break;
      } else if (latest.readyState === 'ERROR') {
        fail(`Deployment failed: ${latest.id}`);
        console.error('\nTo clean up:');
        console.error(`  node scripts/go-live.mjs --cleanup --neon-project-id ${neonProjectId} --vercel-project-id ${vercelProjectId}`);
        process.exit(1);
      }
      process.stdout.write('.');
    }
  } catch {
    // Ignore polling errors — will retry
  }

  await sleep(DEPLOY_POLL_INTERVAL);
}

if (!deployReady) {
  fail(`Deployment timed out after ${DEPLOY_TIMEOUT / 1000}s`);
  console.error('\nThe deployment may still complete. Check Vercel dashboard.');
  console.error(`To clean up if needed:`);
  console.error(`  node scripts/go-live.mjs --cleanup --neon-project-id ${neonProjectId} --vercel-project-id ${vercelProjectId}`);
  process.exit(1);
}

// Verify site loads
step('Verifying site is accessible');

try {
  const siteResponse = await fetch(siteUrl);
  if (siteResponse.ok) {
    ok(`Site returns ${siteResponse.status} at ${siteUrl}`);
  } else {
    warn(`Site returned ${siteResponse.status} — may still be propagating`);
  }
} catch (err) {
  warn(`Could not reach site: ${err.message} — may still be propagating`);
}

// ---------------------------------------------------------------------------
// Step 5: Seed content
// ---------------------------------------------------------------------------
if (!args['skip-seed']) {
  step('Seeding content');

  // Bracken lesson: ALWAYS seed against production, not dev. The Neon/Vercel
  // integration sets different DATABASE_URL per environment.

  // Create admin user via Payload's first-register endpoint
  const adminPassword = randomBytes(16).toString('hex');
  const adminEmail = `admin@${projectName}.deftly.uk`;

  try {
    const registerRes = await fetch(`${siteUrl}/api/users/first-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });

    if (registerRes.ok) {
      ok(`Admin user created: ${adminEmail}`);
    } else {
      const body = await registerRes.text();
      warn(`Admin user creation returned ${registerRes.status}: ${body}`);
    }
  } catch (err) {
    warn(`Admin user creation failed: ${err.message}`);
  }

  // Seed content via the seed endpoint
  try {
    const seedRes = await fetch(`${siteUrl}/api/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (seedRes.ok) {
      ok('Content seeded successfully');
    } else {
      const body = await seedRes.text();
      warn(`Seed returned ${seedRes.status}: ${body}`);
      warn('Site is deployed but may need manual seeding');
    }
  } catch (err) {
    warn(`Seed failed: ${err.message}`);
    warn('Site is deployed but may need manual seeding');
  }

  // Verify admin panel loads
  try {
    const adminRes = await fetch(`${siteUrl}/admin`);
    if (adminRes.ok) {
      ok('Admin panel loads');
    } else {
      warn(`Admin panel returned ${adminRes.status}`);
    }
  } catch (err) {
    warn(`Could not reach admin panel: ${err.message}`);
  }
} else {
  console.log('\n  Skipping seed (--skip-seed flag)');
}

// ---------------------------------------------------------------------------
// Step 6: Output summary
// ---------------------------------------------------------------------------
step('Deployment complete!');

const summary = `
  Site live:       ${siteUrl}
  Admin panel:     ${siteUrl}/admin
  Admin email:     ${args['skip-seed'] ? '(skipped)' : adminEmail}
  Admin password:  ${args['skip-seed'] ? '(skipped)' : adminPassword + ' (change on first login)'}
  Neon project:    ${neonProjectId}
  Vercel project:  ${vercelProjectId}
`;

console.log(summary);

// Save deployment record
const record = `# Deployment Record — ${projectName}

**Date:** ${new Date().toISOString().split('T')[0]}
**Region:** ${args.region}

## URLs
- **Site:** ${siteUrl}
- **Admin:** ${siteUrl}/admin

## Credentials
- **Admin email:** ${args['skip-seed'] ? '(skipped)' : adminEmail}
- **Admin password:** ${args['skip-seed'] ? '(skipped)' : adminPassword} (change on first login)

## Infrastructure IDs
- **Neon project:** ${neonProjectId}
- **Vercel project:** ${vercelProjectId}

## Cleanup Command
\`\`\`bash
node scripts/go-live.mjs --cleanup --neon-project-id ${neonProjectId} --vercel-project-id ${vercelProjectId}
\`\`\`
`;

await writeFile('deployment-record.md', record, 'utf-8');
ok('Saved deployment-record.md');
