#!/usr/bin/env bash
# post.sh — call a Supabase Edge Function with JSON payload
# Usage: ./post.sh <function_name> '<json_payload>'
# Example: ./post.sh decide-move '{"table_id":"LvkvVqk7c34","seat":0}'

set -euo pipefail

FN_NAME="${1:-}"
PAYLOAD="${2:-}"

if [ -z "$FN_NAME" ] || [ -z "$PAYLOAD" ]; then
  echo "Usage: ./fn.sh <function_name> '<json_payload>'" >&2
  exit 1
fi

SUPABASE_KEY="${SUPABASE_KEY:-${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_ANON_KEY:-}}}"
if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_KEY:-}" ]; then
  echo "Error: set SUPABASE_URL and SUPABASE_KEY (or SERVICE_ROLE/ANON) in env." >&2
  exit 1
fi

curl -sSL -X POST "${SUPABASE_URL}/functions/v1/${FN_NAME}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  --data "$PAYLOAD"
