#!/usr/bin/env bash
set -euo pipefail

# === Parse args ===
FIRST_TIME=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--first-time)
      FIRST_TIME=true
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
GIT_ROOT="$(git rev-parse --show-toplevel)"
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
  echo "❌ SCRIPT_ID, MAPS_API_KEY, or PROJECT_ID not set in $CONFIG_FILE"
  exit 1
fi

# === Build TypeScript ===
echo "🔧 Building TypeScript from: $TS_DIR"
cd "$TS_DIR"

if [[ ! -d "node_modules" ]]; then
  echo "📦 Installing dependencies..."
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




# === Optionally generate Init.js ===
if [[ "$FIRST_TIME" == true ]]; then
  echo "🛠️  Injecting Init.js for first-time setup"
  cat <<EOF > "$TMP_DIR/Init.js"
function initialSetup() {
  const key = "$MAPS_API_KEY";
  PropertiesService.getScriptProperties().setProperty("GOOGLE_MAPS_API_KEY", key);
  PropertiesService.getScriptProperties().setProperty("DEBUG", "false");
  Logger.log("✅ Script properties set: GOOGLE_MAPS_API_KEY + DEBUG");
}
EOF
else
  echo "🧹 Removing Init.js if it exists (not first-time run)"
  rm -f "$TMP_DIR/Init.js"
fi

# === Push to Apps Script ===
echo "🚀 Pushing project to Apps Script"
clasp push --force

if [[ "$FIRST_TIME" == true ]]; then
  echo ""
  echo "🔧 Please run initialSetup() ONCE in the Script Editor:"
  echo ""
  echo "🔗 https://script.google.com/home/projects/$SCRIPT_ID/edit"
  echo "→ Select function: initialSetup"
  echo "→ Click ▶ Run (in editor)"
  echo ""
  read -rp "✅ Press ENTER after you’ve done this..."
fi

echo "✅ Done syncing project."


