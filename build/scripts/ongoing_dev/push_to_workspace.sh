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

# === Paths ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

COMMON_SCRIPTS_DIR=$SCRIPT_DIR/../common

CONFIG_FILE="$GIT_ROOT/maps_config.env"

# Build happens in build/ui now:
BUILD_UI_DIR="$GIT_ROOT/build/ui"
BUILD_DIR="$GIT_ROOT/built/ui/gas_safe_staging"   # webpack/inject output

# Blind-copy raw GAS HTML fragments (server-side includes)
RAW_HTML_DIR="$GIT_ROOT/code/ui/src/raw"

# Project-level clasp (root install)
LOCAL_CLASP="$GIT_ROOT/node_modules/.bin/clasp"

# Keep helpers in ui/scripts for now
UTILS_SH="$COMMON_SCRIPTS_DIR/utils.sh"
BOOTSTRAP_SH="$COMMON_SCRIPTS_DIR/bootstrap.sh"

echo "📦 Ensuring local clasp is available..."
cd "$GIT_ROOT"
npm install --silent
echo "🔧 Using clasp from: $LOCAL_CLASP"
"$LOCAL_CLASP" --version

[[ -x "$LOCAL_CLASP" ]] || { echo "❌ Local clasp not found at $LOCAL_CLASP"; exit 1; }

# Optional helpers
[[ -f "$UTILS_SH" ]] && source "$UTILS_SH" || true
[[ -x "$BOOTSTRAP_SH" ]] && bash "$BOOTSTRAP_SH" || true

# === Load config ===
[[ -f "$CONFIG_FILE" ]] || { echo "❌ Missing config: $CONFIG_FILE"; exit 1; }
source "$CONFIG_FILE"

[[ -d "${WORKING_PUSH_FOLDER:-}" ]] || { echo "❌ WORKING_PUSH_FOLDER not set/dir"; exit 1; }

# === Build from build/ui ===
echo "🔧 Building from: $BUILD_UI_DIR"
cd "$BUILD_UI_DIR"
[[ -d node_modules ]] || npm install
npm run build

# === Stage & Push ===
echo "🚧 Working in: $WORKING_PUSH_FOLDER"
cd "$WORKING_PUSH_FOLDER"

# 1) Blind copy ALL raw assets first (contents only)
[[ -d "$RAW_HTML_DIR" ]] || { echo "❌ RAW_HTML_DIR not found: $RAW_HTML_DIR"; exit 1; }
echo "📄 Copying raw assets from: $RAW_HTML_DIR"
cp -a "$RAW_HTML_DIR"/. "$WORKING_PUSH_FOLDER"/

# 2) appsscript.json from ui/ (project settings)
UI_APPSSCRIPT_JSON="$GIT_ROOT/ui/appsscript.json"
[[ -f "$UI_APPSSCRIPT_JSON" ]] || { echo "❌ appsscript.json missing at $UI_APPSSCRIPT_JSON"; exit 1; }
cp "$UI_APPSSCRIPT_JSON" "$WORKING_PUSH_FOLDER/"


# 3) Push
echo "🚀 Pushing project to Apps Script"
"$LOCAL_CLASP" push --force

# 4) Optional remote init
echo "🏁 Running remote smokeTest (expects SUCCESS)"
if npx --yes @google/clasp@2.4.0 run smokeTest | grep -q SUCCESS; then
    echo "✅ smoke test passed"
else
    echo "❌ smoke test passed"
    exit 1
fi
