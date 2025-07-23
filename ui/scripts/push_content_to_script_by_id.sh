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
GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
CONFIG_FILE="$GIT_ROOT/maps_config.env"
UI_DIR="$GIT_ROOT/ui"
BUILD_DIR="$UI_DIR/build/gas_safe_staging"
BUILD_TS_DIR="$UI_DIR/build/unit_testable_js"
SRC_DIR="$UI_DIR/src"
LOCAL_CLASP="$GIT_ROOT/node_modules/.bin/clasp"

echo "📦 Ensuring local clasp is available..."
cd "$GIT_ROOT"
npm install --silent

echo "🔧 Using clasp from: $LOCAL_CLASP"
"$LOCAL_CLASP" --version

# === Guard: Ensure local clasp binary is available ===
if [[ ! -x "$LOCAL_CLASP" ]]; then
  echo "❌ ERROR: Local clasp not found at $LOCAL_CLASP"
  echo "💡 Tip: Run 'npm install' from project root to install clasp"
  exit 1
fi

# === Ensure login ===
source "$SCRIPT_DIR/utils.sh"
ensure_logged_in

# === Run project bootstrap to ensure dependencies are installed ===
bash "$SCRIPT_DIR/bootstrap.sh"

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

# === Build TypeScript ===
echo "🔧 Building TypeScript from: $UI_DIR"
cd "$UI_DIR"

if [[ ! -d "node_modules" ]]; then
  echo "📦 Installing local dependencies... all except clasp"
  npm install
fi

echo "🛠️  Running build..."
npm run build

# === Clone target Apps Script project ===
TMP_DIR="$(mktemp -d /tmp/clasp_push_XXXX)"
echo "🚧 Working in: $TMP_DIR"
cd "$TMP_DIR"

echo "📥 Cloning script ID: $SCRIPT_ID"
$LOCAL_CLASP clone "$SCRIPT_ID" >/dev/null

# === Copy compiled TS output ===
echo "📦 Copying built TypeScript output"
cp "$BUILD_DIR/Code.js" "$TMP_DIR/"
cp "$UI_DIR/appsscript.json" "$TMP_DIR/"
cp "$GIT_ROOT/maps_config.env" "$TMP_DIR/"

echo "📦 Copying Webpack GAS-safe output (JS)"
cp "$BUILD_DIR"/*.js "$TMP_DIR/"

if [[ -f "$BUILD_DIR/FilterUI.html" ]]; then
  echo "📥 Copying FilterUI.html"
  cp "$BUILD_DIR/FilterUI.html" "$TMP_DIR/"
else
  echo "⚠️  ERROR: BUILD_DIR/FilterUI.html not found"
  exit 1
fi

# === Inject Init.js for setting script properties ===
if [[ "$SKIP_INIT" == false ]]; then
  echo "🧬 Creating Init.js to set script properties..."
  cat <<EOF > "$TMP_DIR/Init.js"
function initialSetup() {
  const key = "$MAPS_API_KEY";
  PropertiesService.getScriptProperties().setProperty("GOOGLE_MAPS_API_KEY", key);
  PropertiesService.getScriptProperties().setProperty("DEBUG", "false");
  PropertiesService.getScriptProperties().setProperty("YEBUG", "cat");
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
$LOCAL_CLASP push --force

# === Clean up sensitive Init.js after push ===
if [[ "$SKIP_INIT" == false ]]; then
  echo "🧽 Cleaning up Init.js"
  rm -f "$TMP_DIR/Init.js"
fi

# === DEPLOY after push ===
echo "🚀 Deploying new version..."
DEPLOY_OUTPUT=$($LOCAL_CLASP deploy --description "Auto-deploy from push script")
echo "$DEPLOY_OUTPUT"

DEPLOYMENT_ID=$(echo "$DEPLOY_OUTPUT" | grep -o 'AKfycb[a-zA-Z0-9_-]*' | head -n 1)

if [[ -z "$DEPLOYMENT_ID" ]]; then
  echo "❌ Failed to extract DEPLOYMENT_ID"
  exit 1
fi

echo "✅ Deployment ID: $DEPLOYMENT_ID"

# === Update maps_config.env with DEPLOYMENT_ID ===
update_env_var DEPLOYMENT_ID "$DEPLOYMENT_ID"

echo "✅ Done syncing and deploying from working folder $TMP_DIR"

