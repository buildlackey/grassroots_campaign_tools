#!/usr/bin/env bash
set -euo pipefail

# === Parse args ===
TARGET="all"   # default matches current behavior
while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--target)
      TARGET="${2:-}"; shift 2 ;;
    --target=*)
      TARGET="${1#*=}"; shift ;;
    *)
      echo "❌ Unknown option: $1"
      echo "Usage: $0  [-t|--target ui|gas|all(default)]"
      exit 1
      ;;
  esac
done

# === Standard Preamble  ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGIN_SCRIPT_DIR=$SCRIPT_DIR
GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
COMMON_SCRIPTS_DIR=$GIT_ROOT/build/scripts/common
BUILD_UI_DIR="$GIT_ROOT/build/ui"
BUILD_GAS_DIR="$GIT_ROOT/build/gas"

.  "$COMMON_SCRIPTS_DIR/utils.sh"

# Login and verify we are properly logged in
$LOGIN_SCRIPT_DIR/clasp_login.sh
"$LOCAL_CLASP" login --status >/dev/null || { echo "❌ clasp status failed "; exit 1; }

#BOOTSTRAP_SH="$COMMON_SCRIPTS_DIR/bootstrap.sh"
#[[ -x "$BOOTSTRAP_SH" ]] && bash "$BOOTSTRAP_SH" || true

cd "$GIT_ROOT"
#npm install --silent || true    # keep existing behavior; tolerate no-op

# Helper: build one target if present
build_ui() {
  if [[ -d "$BUILD_UI_DIR" ]]; then
    echo "🔧 Building UI from: $BUILD_UI_DIR"
    cd "$BUILD_UI_DIR"
    [[ -d node_modules ]] || npm install
    npm run dist
  else
    echo "⚠️ Skipping UI: directory not found at $BUILD_UI_DIR"
  fi
}

build_gas() {
    cd "$BUILD_GAS_DIR"
    npm run dist
}

# === Build selected targets ===
case "$TARGET" in
  ui)
    build_ui
    ;;
  gas)
    build_gas
    ;;
  all)
    build_ui
    build_gas
    ;;
  *)
    echo "❌ Unknown target: $TARGET (expected ui|gas|all)"
    exit 1
    ;;
esac

# === Stage & Push ===
echo "🚧 Working in: $WORKING_PUSH_FOLDER"
cd "$WORKING_PUSH_FOLDER"

# 1) Validate scriptId alignment
CLASP_SCRIPT_ID=$(jq -r '.scriptId' .clasp.json)
if [[ "$CLASP_SCRIPT_ID" != "$SCRIPT_ID" ]]; then
  echo "❌ .clasp.json scriptId ($CLASP_SCRIPT_ID) does not match expected ($SCRIPT_ID)"
  exit 1
fi

# 2) Copy appsscript.json if present (UI path), otherwise tolerate absence
UI_APPSSCRIPT_JSON="$GIT_ROOT/ui/appsscript.json"
if [[ -f "$UI_APPSSCRIPT_JSON" ]]; then
  echo "📄 Syncing appsscript.json from UI"
  cp "$UI_APPSSCRIPT_JSON" "$WORKING_PUSH_FOLDER/"
else
  echo "ℹ️ No UI appsscript.json found at $UI_APPSSCRIPT_JSON — leaving existing one in place"
fi

# 3) 🔑 Inject real Maps API key into Code.js (placeholder "GOOGLE_MAPS_API_KEY")
#    Only touch Code.js in the staging folder right before push.
if [[ -f "$WORKING_PUSH_FOLDER/Code.js" ]]; then
  if [[ -n "${MAPS_API_KEY:-}" ]]; then
    if grep -q '"GOOGLE_MAPS_API_KEY"' "$WORKING_PUSH_FOLDER/Code.js"; then
      echo "🔑 Injecting Maps API key into Code.js..."
      # Replace the quoted placeholder to avoid accidental partial matches
      sed -i "s|\"GOOGLE_MAPS_API_KEY\"|\"${MAPS_API_KEY}\"|g" "$WORKING_PUSH_FOLDER/Code.js"

      # Verify substitution took effect
      if grep -q '"GOOGLE_MAPS_API_KEY"' "$WORKING_PUSH_FOLDER/Code.js"; then
        echo "❌ Injection check failed: placeholder still present in Code.js after sed"
        exit 1
      else
        echo "✅ API key injected into Code.js"
      fi
    else
      echo "ℹ️ No placeholder found in Code.js; skipping API key injection"
    fi
  else
    echo "⚠️ MAPS_API_KEY not set in environment (maps_config.env). Skipping injection; Code.js will keep placeholder."
  fi
else
  echo "❌ Code.js not found in $WORKING_PUSH_FOLDER — cannot inject API key"
  exit 1
fi
# 4) Push
echo "🚀 Pushing project to Apps Script"
"$LOCAL_CLASP" push --force

# 5) Optional remote smoke test
echo "🏁 Running remote smokeTest (expects SUCCESS)"
if "$LOCAL_CLASP" run smokeTest | grep -q SUCCESS; then
  echo "✅ smoke test passed"
else
  echo "❌ smoke test failed"
  exit 1
fi

