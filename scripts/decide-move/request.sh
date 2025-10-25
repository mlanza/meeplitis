#!/usr/bin/env bash
set -euo pipefail

# Read prompt text from file
PROMPT=$(<"$(dirname "$0")/prompt.md")

# Safely convert prompt into JSON using jq
DATA=$(jq -n --arg p "$PROMPT" '{prompt:$p}')

# Send request
curl -sSL -X POST "${SUPABASE_URL}/functions/v1/decide-move" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  --data "$DATA"
