#!/usr/bin/env bash
set -euo pipefail

# === Parse args ===
SKIP_INIT=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--update)
      SKIP_INIT=true
      shift
      ;;
    *)
      echo "❌ Unknown option: $1"
      exit 1
      ;;
  esac
done

# === Paths ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"
GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
CONFIG_FILE="$GIT_ROOT/maps_config.env"
TS_DIR="$GIT_ROOT/ui2"

# === Ensure login ===
ensure_login

# === Load config ===
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "❌ Missing config file: $CONFIG_FILE"
  exit 1
fi
source "$CONFIG_FILE"

if [[ -z "${SCRIPT_ID:-}" || -z "${MAPS_API_KEY:-}" ]]; then
  echo "❌ SCRIPT_ID or MAPS_API_KEY not set in $CONFIG_FILE"
  exit 1
fi

# === Ensure clasp is globally installed ===
if ! command -v clasp >/dev/null 2>&1; then
  echo "🔧 clasp not found. Installing globally..."
  npm install -g clasp
else
  echo "✅ clasp is already installed globally"
fi

# === Build TypeScript ===
echo "🔧 Building TypeScript from: $TS_DIR"
cd "$TS_DIR"

if [[ ! -d "node_modules" ]]; then
  echo "📦 Installing local dependencies... all except clasp"
  npm install
fi

echo "🛠️  Running build..."
npm run build

BUILD_DIR="$TS_DIR/build"
if [[ ! -f "$BUILD_DIR/Code.js" ]]; then
  echo "❌ Build failed or missing output files"
  exit 1
fi

# === Clone target Apps Script project ===
TMP_DIR="$(mktemp -d /tmp/clasp_push_XXXX)"
echo "🚧 Working in: $TMP_DIR"
cd "$TMP_DIR"

echo "📥 Cloning script ID: $SCRIPT_ID"
clasp clone "$SCRIPT_ID" >/dev/null

# === Copy compiled TS output ===
echo "📦 Copying built TypeScript output"
cp "$BUILD_DIR/Code.js" "$TMP_DIR/"
cp "$TS_DIR/appsscript.json" "$TMP_DIR/"

# === Inject Init.js for setting script properties ===
if [[ "$SKIP_INIT" == false ]]; then
  echo "🧬 Creating Init.js to set script properties..."
  cat <<EOF > "$TMP_DIR/Init.js"
function initialSetup() {
  const key = "$MAPS_API_KEY";
  PropertiesService.getScriptProperties().setProperty("GOOGLE_MAPS_API_KEY", key);
  PropertiesService.getScriptProperties().setProperty("DEBUG", "false");
  Logger.log("✅ Script properties set: GOOGLE_MAPS_API_KEY + DEBUG");
}
initialSetup();
EOF
else
  echo "🧹 Skipping Init.js generation (--update mode)"
  rm -f "$TMP_DIR/Init.js"
fi

# === Push to Apps Script ===
echo "🚀 Pushing project to Apps Script"
clasp push --force

# === Clean up sensitive Init.js after push ===
if [[ "$SKIP_INIT" == false ]]; then
  echo "🧽 Cleaning up Init.js"
  rm -f "$TMP_DIR/Init.js"
fi

echo "✅ Done syncing project."
