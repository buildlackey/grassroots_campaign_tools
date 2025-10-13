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
      echo "Usage: $0  [-t|--target ui|gas|common|all(default)]"
      exit 1
      ;;
  esac
done

# === Standard Preamble  ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGIN_SCRIPT_DIR=$SCRIPT_DIR
PROJECT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
COMMON_SCRIPTS_DIR=$PROJECT_ROOT/build/scripts/common
BUILD_UI_DIR="$PROJECT_ROOT/build/ui"
BUILD_GAS_DIR="$PROJECT_ROOT/build/gas"
BUILD_COMMON_DIR="$PROJECT_ROOT/build/common"

.  "$COMMON_SCRIPTS_DIR/utils.sh"

# Clean old cruft
pushd "$WORKING_PUSH_FOLDER"
rm -rf *.ts *.js *.html
popd

# Login and verify we are properly logged in
$LOGIN_SCRIPT_DIR/clasp_login.sh
"$LOCAL_CLASP" login --status >/dev/null || { echo "❌ clasp status failed "; exit 1; }

cd "$PROJECT_ROOT"

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
  echo "LISTING after GAS build:"
  ls "$PROJECT_ROOT/dist/gas/gas_safe_staging"

  # === Apply demodulify post-processing ===
  echo "🔧 Running demodulify post-processing on GAS output..."
  cd "$PROJECT_ROOT/dist/gas"
  node "$PROJECT_ROOT/build/scripts/ongoing_dev/demodulify_for_gas.js"

  echo "LISTING after demodulify:"
  ls "$PROJECT_ROOT/dist/gas/gas_safe_staging"
}

build_common() {
  if [[ -d "$BUILD_COMMON_DIR" ]]; then
    echo "🔧 Building Common from: $BUILD_COMMON_DIR"
    cd "$BUILD_COMMON_DIR"
    [[ -d node_modules ]] || npm install
    npm run dist

    # === Apply demodulify post-processing to common output ===
    echo "🔧 Running demodulify post-processing on Common output..."
    cd "$PROJECT_ROOT/dist/common"
    node "$PROJECT_ROOT/build/scripts/ongoing_dev/demodulify_for_gas.js"
  else
    echo "⚠️ Skipping Common: directory not found at $BUILD_COMMON_DIR"
  fi
}

# === Build selected targets ===
case "$TARGET" in
  ui) build_ui ;;
  gas) build_gas ;;
  common) build_common ;;
  all) build_ui; build_gas; build_common ;;
  *) echo "❌ Unknown target: $TARGET (expected ui|gas|common|all)"; exit 1 ;;
esac

# === Stage & Push ===
echo "🚧 Working in: $WORKING_PUSH_FOLDER"
cd "$WORKING_PUSH_FOLDER"

# 1) Validate scriptId alignment
jq --arg pid "$PROJECT_ID" '.projectId=$pid' .clasp.json > .clasp.tmp && mv .clasp.tmp .clasp.json

CLASP_SCRIPT_ID=$(jq -r '.scriptId' .clasp.json)
if [[ "$CLASP_SCRIPT_ID" != "$SCRIPT_ID" ]]; then
  echo "❌ .clasp.json scriptId ($CLASP_SCRIPT_ID) does not match expected ($SCRIPT_ID)"
  exit 1
fi

# 2) Need runtime V8 in appsscript.json
cat > $WORKING_PUSH_FOLDER/appsscript.json <<END
{
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "executionApi": {
    "access": "ANYONE"
  }
}
END

# === Stage build artifacts into working push folder ===
echo "📦 Staging dist artifacts into $WORKING_PUSH_FOLDER"
cp -a  $PROJECT_ROOT/dist/*/gas_safe_staging/*    "$WORKING_PUSH_FOLDER/"


# === Duplicate CampaignToolsModel for server + client ===
if [[ -f "$WORKING_PUSH_FOLDER/CampaignToolsModel.js" ]]; then
  cp "$WORKING_PUSH_FOLDER/CampaignToolsModel.js" "$WORKING_PUSH_FOLDER/CampaignToolsModelCode.html"
  rm "$WORKING_PUSH_FOLDER/CampaignToolsModel.js"
  echo "📑 Created CampaignToolsModel.gs (server) and CampaignToolsModelCode.html (client include)"
else
  echo "⚠️ CampaignToolsModel.js not found in $WORKING_PUSH_FOLDER"
fi


# 3) 🔑 Inject real Maps API key into Code.js
sed -i "s|\"GOOGLE_MAPS_API_KEY\"|\"${GOOGLE_MAPS_API_KEY}\"|g" "$WORKING_PUSH_FOLDER/Code.js"

# 4) Push

# === Remove duplicate JS files if HTML version exists ===
for htmlfile in "$WORKING_PUSH_FOLDER"/*.html; do
  jsfile="${htmlfile%.html}.js"
  if [[ -f "$jsfile" ]]; then
    echo "⚠️ Duplicate detected: $(basename "$htmlfile") and $(basename "$jsfile") -- removing JS file to avoid GAS push conflict."
    rm "$jsfile"
  fi
done

echo "🚀 Pushing project to Apps Script"
"$LOCAL_CLASP" push --force


echo "🏁 Running remote smokeTest (expects SUCCESS)"
if "$LOCAL_CLASP" run smokeTest | grep -q SUCCESS; then
  echo "✅ smoke test passed"
else
  echo "❌ smoke test failed"
  exit 1
fi


"$PROJECT_ROOT/build/scripts/e2e_tests/run_e2e_tests.sh"
