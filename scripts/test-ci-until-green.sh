#!/usr/bin/env bash
# Run Cypress CI until green (install-quench + container restart each attempt).
set -euo pipefail
cd "$(dirname "$0")/.."

export CYPRESS_CACHE_FOLDER="${CYPRESS_CACHE_FOLDER:-$HOME/Library/Caches/Cypress}"
unset CYPRESS_RUN_BINARY

attempt=0
while true; do
  attempt=$((attempt + 1))
  echo "=== test:ci attempt $attempt ==="
  node scripts/install-quench.js
  node scripts/restart-foundry-container.js
  node scripts/wait-for-foundry.js
  if npm run test:ci; then
    echo "=== PASSED on attempt $attempt ==="
    exit 0
  fi
  echo "=== FAILED attempt $attempt — retrying in 5s ==="
  sleep 5
done
