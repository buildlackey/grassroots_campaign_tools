#!/usr/bin/env bash
set -euo pipefail


# === Parse args ===
SKIP_INIT=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--update) SKIP_INIT=true; shift ;;
    *) echo "❌ Unknown option: $1"; exit 1 ;;
  esac
done

# === Standard Preamble  ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
COMMON_SCRIPTS_DIR=$SCRIPT_DIR/../common

.  $COMMON_SCRIPTS_DIR/utils.sh

ensure_clasp_login
"$LOCAL_CLASP" login --status >/dev/null || { echo "❌ clasp status failed — please run ensure_clasp_login"; exit 1; }

#
BUILD_UI_DIR="$GIT_ROOT/build/ui"
BUILD_DIR="$GIT_ROOT/built/ui/gas_safe_staging"   # webpack/inject output
#
# Blind-copy raw GAS HTML fragments (server-side includes)
RAW_HTML_DIR="$GIT_ROOT/code/ui/src/raw"
#
#  GAS raw JS pushed directly to Apps Script
GAS_RAW_DIR="$GIT_ROOT/code/gas/raw"
#


BOOTSTRAP_SH="$COMMON_SCRIPTS_DIR/bootstrap.sh"
[[ -x "$BOOTSTRAP_SH" ]] && bash "$BOOTSTRAP_SH" || true

cd "$GIT_ROOT"
npm install --silent




[[ -d "${WORKING_PUSH_FOLDER:-}" ]] || { echo "❌ WORKING_PUSH_FOLDER not set/dir"; exit 1; }

# === Build from build/ui ===
echo "🔧 Building from: $BUILD_UI_DIR"
cd "$BUILD_UI_DIR"
[[ -d node_modules ]] || npm install
npm run build


# === Stage & Push ===
echo "🚧 Working in: $WORKING_PUSH_FOLDER"
cd "$WORKING_PUSH_FOLDER"

# 0) Copy built GAS artifacts 
[[ -d "$BUILD_DIR" ]] || { echo "❌ Built UI output not found: $BUILD_DIR"; exit 1; }
echo "📦 Copying built UI artifacts from: $BUILD_DIR"
cp -a "$BUILD_DIR"/. "$WORKING_PUSH_FOLDER"/



# 1) Blind copy ALL raw UI assets (contents only)
[[ -d "$RAW_HTML_DIR" ]] || { echo "❌ RAW_HTML_DIR not found: $RAW_HTML_DIR"; exit 1; }
echo "📄 Copying raw UI assets from: $RAW_HTML_DIR"
cp -a "$RAW_HTML_DIR"/. "$WORKING_PUSH_FOLDER"/


# 1b) Copy GAS raw files (real backend: sheet_utils.js, etc.) — fail-fast if empty
if [[ -d "$GAS_RAW_DIR" ]]; then
  echo "🧠 Copying GAS raw files from: $GAS_RAW_DIR"
  shopt -s nullglob
  files=("$GAS_RAW_DIR"/*)
  shopt -u nullglob
  if [[ ${#files[@]} -eq 0 ]]; then
    echo "❌ GAS_RAW_DIR exists but is empty: $GAS_RAW_DIR"
    exit 1
  fi
  cp -a "$GAS_RAW_DIR"/. "$WORKING_PUSH_FOLDER"/
  echo "📄 GAS files staged:"
  find "$WORKING_PUSH_FOLDER" -maxdepth 1 -type f -printf "  - %f\n" | sed -n '/\.js$/p'
else
  echo "⚠️ GAS raw dir not found (skipping): $GAS_RAW_DIR"
fi

# 2) appsscript.json from ui/ (project settings)
UI_APPSSCRIPT_JSON="$GIT_ROOT/ui/appsscript.json"
[[ -f "$UI_APPSSCRIPT_JSON" ]] || { echo "❌ appsscript.json missing at $UI_APPSSCRIPT_JSON"; exit 1; }
cp "$UI_APPSSCRIPT_JSON" "$WORKING_PUSH_FOLDER/"

# 3) Push
echo "🚀 Pushing project to Apps Script"
"$LOCAL_CLASP" push --force

# 4) Optional remote smoke test
echo "🏁 Running remote smokeTest (expects SUCCESS)"
if $LOCAL_CLASP run smokeTest | grep -q SUCCESS; then
    echo "✅ smoke test passed"
else
    echo "❌ smoke test failed"
    exit 1
fi

