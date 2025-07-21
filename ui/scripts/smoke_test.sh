#!/usr/bin/env bash
set -euo pipefail






# === Locate and source config ===
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo PROJECT_ROOT: $PROJECT_ROOT

GIT_ROOT=$PROJECT_ROOT
CONFIG_FILE="$GIT_ROOT/maps_config.env"
UI_DIR="$GIT_ROOT/ui"
BUILD_DIR="$UI_DIR/build/gas_safe_staging"
LOCAL_CLASP="$GIT_ROOT/node_modules/.bin/clasp"

echo "🔧 Using clasp from: $LOCAL_CLASP"
"$LOCAL_CLASP" --version





CONFIG_FILE="${PROJECT_ROOT}/maps_config.env"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "❌ Config file not found: $CONFIG_FILE"
  exit 1
fi

source "$CONFIG_FILE"

echo "🧪 Running smoke test using clasp for SCRIPT_ID=$SCRIPT_ID"

# === Run GAS function using clasp ===
RESULT=$(npx clasp run smokeTest --dev 2>&1)

# Echo output for debugging
echo "result of smoke test: $RESULT"

# === Check for expected result string
if echo "$RESULT" | grep -q '✔ Result: SUCCESS'; then
  echo "✅ Smoke test passed!"
else
  echo "❌ Smoke test failed"
  exit 1
fi

