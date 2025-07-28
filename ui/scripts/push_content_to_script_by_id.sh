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
#ensure_logged_in

# === Run project bootstrap to ensure dependencies are installed ===
bash "$SCRIPT_DIR/bootstrap.sh"

# === Load config ===
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "❌ Missing config file: $CONFIG_FILE"
  exit 1
fi
source "$CONFIG_FILE"

if [[ -z "${MAPS_API_KEY:-}" ]]; then
  echo "❌ MAPS_API_KEY not set in $CONFIG_FILE"
  exit 1
fi

if [[ ! -d "${WORKING_PUSH_FOLDER:-}" ]]; then
  echo "❌ could not find $WORKING_PUSH_FOLDER"
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
TMP_DIR=$WORKING_PUSH_FOLDER                ##  let us inline tmp_dir soon 
echo "🚧 Working in: $TMP_DIR"
cd "$TMP_DIR"

SCRIPT_ID=$(jq -r '.scriptId' .clasp.json)

if [[ -z "$SCRIPT_ID" || "$SCRIPT_ID" == "null" ]]; then
  echo "❌ scriptId not found in .clasp.json"
  exit 1
fi

echo "✅ Script ID: $SCRIPT_ID  - might not even need it.. take out if useless"
  


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
  const props = PropertiesService.getScriptProperties();
  const existingKey = props.getProperty("GOOGLE_MAPS_API_KEY");

  if (existingKey) {
    Logger.log("⚠️ Script properties already set. Skipping initialization.");
    return "INIT_SKIPPED";
  }

  const key = "$MAPS_API_KEY";  // Placeholder - replace with real key or runtime inject
  props.setProperty("GOOGLE_MAPS_API_KEY", key);
  props.setProperty("DEBUG", "false");
  props.setProperty("YEBUG", "cat");

  Logger.log("✅ Script properties initialized.");
  return "INIT_DONE";
}
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


echo running initialSetup 
npx --yes @google/clasp@2.4.0 run initialSetup 

echo running hello 
npx --yes @google/clasp@2.4.0 run hello | grep HELLO
if [ "$?" != "0" ] ; then 
  echo "❌ smoke test failed"
  exit 1
fi



echo "✅ Done syncing and deploying from working folder $TMP_DIR"

