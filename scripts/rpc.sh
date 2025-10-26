#!/usr/bin/env bash
# rpc.sh — call any Supabase Postgres RPC via REST
# Usage: ./rpc.sh <rpc_name> '<json_payload>'
# Example: ./rpc.sh move_prompt '{"_table_id":"LvkvVqk7c34","_seat":0}'

set -euo pipefail

RPC_NAME="${1:-}"
PAYLOAD="${2:-}"

if [ -z "$RPC_NAME" ] || [ -z "$PAYLOAD" ]; then
  echo "Usage: ./rpc.sh <rpc_name> '<json_payload>'" >&2
  exit 1
fi

SUPABASE_KEY="${SUPABASE_KEY:-${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_ANON_KEY:-}}}"
if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_KEY:-}" ]; then
  echo "Error: set SUPABASE_URL and SUPABASE_KEY (or SERVICE_ROLE/ANON) in env." >&2
  exit 1
fi

curl -sSL -X POST "${SUPABASE_URL}/rest/v1/rpc/${RPC_NAME}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  --data "$PAYLOAD"
