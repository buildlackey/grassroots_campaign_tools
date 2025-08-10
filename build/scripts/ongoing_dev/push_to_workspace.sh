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



# Project-level clasp: pin to the working version (keep name "LOCAL_CLASP")
LOCAL_CLASP="npx --yes @google/clasp@3.0.6-alpha"

ensure_clasp_login() {
  if [[ -f "$HOME/.clasprc.json" ]]; then
    echo "✅ clasp already logged in"; return
  fi
  [[ -n "${OAUTH_CLIENT_SECRET_PATH:-}" && -f "$OAUTH_CLIENT_SECRET_PATH" ]] \
    || { echo "❌ OAUTH_CLIENT_SECRET_PATH missing/invalid"; exit 1; }

  echo "🔐 Running clasp login…"
  tmpdir="$(mktemp -d -t clasp_login_XXXXXX)"
  pushd "$tmpdir" >/dev/null
  echo '{}' > package.json
  # 🔒 Use the same pinned clasp everywhere
  $LOCAL_CLASP login --creds "$OAUTH_CLIENT_SECRET_PATH" || true
  [[ -f "$HOME/.clasprc.json" ]] || [[ -f ".clasprc.json" ]] \
    || { echo "❌ clasp login did not produce a token file"; exit 1; }
  [[ -f ".clasprc.json" ]] && cp .clasprc.json "$HOME/.clasprc.json"
  popd >/dev/null
  echo "✅ clasp login ready"
}

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

# NEW: GAS raw JS pushed directly to Apps Script
GAS_RAW_DIR="$GIT_ROOT/code/gas/raw"

# Keep helpers in ui/scripts for now (unchanged)
UTILS_SH="$COMMON_SCRIPTS_DIR/utils.sh"
BOOTSTRAP_SH="$COMMON_SCRIPTS_DIR/bootstrap.sh"

echo "📦 Ensuring local clasp is available..."
cd "$GIT_ROOT"
npm install --silent
echo "🔧 Using clasp: $LOCAL_CLASP"
$LOCAL_CLASP -V

# Optional helpers
[[ -f "$UTILS_SH" ]] && source "$UTILS_SH" || true
[[ -x "$BOOTSTRAP_SH" ]] && bash "$BOOTSTRAP_SH" || true

# === Load config ===
[[ -f "$CONFIG_FILE" ]] || { echo "❌ Missing config: $CONFIG_FILE"; exit 1; }
source "$CONFIG_FILE"

# Ensure clasp token up-front (fail fast)
ensure_clasp_login

# (Optional sanity push from the temp workspace if you need it)
if [[ -d /tmp/clasp_login_create_xOQdux ]]; then
  ( cd /tmp/clasp_login_create_xOQdux ; echo pushing 1 ; $LOCAL_CLASP push || true )
fi

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

# (Optional sanity push again if you want to keep it)
if [[ -d /tmp/clasp_login_create_xOQdux ]]; then
  ( cd /tmp/clasp_login_create_xOQdux ; echo pushing 2 ; $LOCAL_CLASP push || true )
fi

# 1b) Copy GAS raw files (real backend)
if [[ -d "$GAS_RAW_DIR" ]]; then
  echo "🧠 Copying GAS raw files from: $GAS_RAW_DIR"
  cp -a "$GAS_RAW_DIR"/. "$WORKING_PUSH_FOLDER"/
else
  echo "⚠️ GAS raw dir not found (skipping): $GAS_RAW_DIR"
fi

# 2) appsscript.json from ui/ (project settings)
UI_APPSSCRIPT_JSON="$GIT_ROOT/ui/appsscript.json"
[[ -f "$UI_APPSSCRIPT_JSON" ]] || { echo "❌ appsscript.json missing at $UI_APPSSCRIPT_JSON"; exit 1; }
cp "$UI_APPSSCRIPT_JSON" "$WORKING_PUSH_FOLDER/"

# 3) Push (single, pinned clasp)
echo "🚀 Pushing project to Apps Script"
$LOCAL_CLASP push --force

# 4) Optional remote init (pin version here too)
echo "🏁 Running remote smokeTest (expects SUCCESS)"
if $LOCAL_CLASP run smokeTest | grep -q SUCCESS; then
  echo "✅ smoke test passed"
else
  echo "❌ smoke test failed"
  exit 1
fi


