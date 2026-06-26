#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Deploy the Deftly engine (deftly-site-template) to Vercel — one command.
#
# Secrets are read from your shell ENVIRONMENT and pushed into Vercel. This
# script contains NO secret values and writes none to disk. The standing engine
# secrets (POSTGRES_URL, PAYLOAD_SECRET, BLOB_READ_WRITE_TOKEN, etc.) are already
# configured on the Vercel project, so a plain redeploy reuses them; this script
# (re)sets the routing + shared-queue vars that this run introduced.
#
# Usage:
#   # the locked-down build-queue login (NOT the Supabase superuser):
#   export CONTROL_PLANE_DATABASE_URL='postgresql://deftly_engine.wvtpijedmvelwzlhfbbx:<pw>@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=no-verify'
#   ./deploy.sh
#
# Prereqs: `vercel login` done; this folder linked to the deftly-site-template
#   project (.vercel/project.json -> prj_eb6fKb6dTyYjjcM26H0Qr50sb03u).
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

: "${CONTROL_PLANE_DATABASE_URL:?Set CONTROL_PLANE_DATABASE_URL (the deftly_engine build-queue login) in your shell.}"
ROOT_DOMAIN="${ROOT_DOMAIN:-deftly.uk}"
PREVIEW_BASE_DOMAIN="${PREVIEW_BASE_DOMAIN:-deftly.uk}"

push() { vercel env rm "$1" production -y >/dev/null 2>&1 || true; printf '%s' "$2" | vercel env add "$1" production >/dev/null; echo "  set $1"; }

echo "Setting engine routing + shared-queue env on Vercel:"
push ROOT_DOMAIN "$ROOT_DOMAIN"
push PREVIEW_BASE_DOMAIN "$PREVIEW_BASE_DOMAIN"
push PAYLOAD_DB_PUSH "false"
push CONTROL_PLANE_DATABASE_URL "$CONTROL_PLANE_DATABASE_URL"

echo "Deploying engine to production (build runs payload migrate first)..."
vercel deploy --prod --yes
