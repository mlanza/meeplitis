#!/usr/bin/env bash
# get.sh — GET an Edge Function with JSON query args or a raw query string
# Usage:
#   ./get.sh <function_name> '<json>'
#   ./get.sh <function_name> 'k1=v1&k2=v2'

set -euo pipefail

FN_NAME="${1:-}"; ARG="${2:-}"
[ -n "$FN_NAME" ] || { echo "Usage: ./get.sh <function_name> '<json|query>'" >&2; exit 1; }

KEY="${SUPABASE_KEY:-${SUPABASE_ANON_KEY:-}}"
[ -n "${SUPABASE_URL:-}" ] || { echo "Error: set SUPABASE_URL" >&2; exit 1; }
[ -n "$KEY" ] || { echo "Error: set SUPABASE_KEY or SUPABASE_ANON_KEY" >&2; exit 1; }

base="${SUPABASE_URL}/functions/v1/${FN_NAME}"

build_qs_from_json() {
  jq -rn --argjson obj "$ARG" '
    def enc: @uri;
    ($obj
     | to_entries
     | map( (.key|tostring|enc) + "=" + (.value|tostring|enc) )
     | join("&"))
  '
}

if [[ "$ARG" == \{* ]]; then
  QS="$(build_qs_from_json)"
else
  QS="$ARG"  # already a query string
fi

URL="${base}${QS:+?${QS}}"

curl -sSL -X GET "$URL" \
  -H "Authorization: Bearer ${KEY}" \
  -H "apikey: ${KEY}"
