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
UNIT_TESTABLE_DIR="$UI_DIR/build/unit_testable_js"
SRC_DIR="$UI_DIR/src"
LOCAL_CLASP="$GIT_ROOT/node_modules/.bin/clasp"

echo "📦 Ensuring local clasp is available..."
cd "$GIT_ROOT"
npm install --silent

echo "🔧 Using clasp from: $LOCAL_CLASP"
"$LOCAL_CLASP" --version

if [[ ! -x "$LOCAL_CLASP" ]]; then
  echo "❌ ERROR: Local clasp not found at $LOCAL_CLASP"
  echo "💡 Tip: Run 'npm install' from project root to install clasp"
  exit 1
fi

source "$SCRIPT_DIR/clasp_login.sh"
bash "$SCRIPT_DIR/bootstrap.sh"

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

echo "🔧 Building TypeScript from: $UI_DIR"
cd "$UI_DIR"

if [[ ! -d "node_modules" ]]; then
  echo "📦 Installing local dependencies..."
  npm install
fi

echo "🛠️  Running build..."
npm run build

echo "🚧 Working in: $WORKING_PUSH_FOLDER"
cd "$WORKING_PUSH_FOLDER"

SCRIPT_ID=$(jq -r '.scriptId' .clasp.json)
if [[ -z "$SCRIPT_ID" || "$SCRIPT_ID" == "null" ]]; then
  echo "❌ scriptId not found in .clasp.json"
  exit 1
fi
echo "✅ Script ID: $SCRIPT_ID"

echo "📦 Copying built TypeScript output"
cp "$BUILD_DIR/Code.js" "$WORKING_PUSH_FOLDER/"
cp "$UI_DIR/appsscript.json" "$WORKING_PUSH_FOLDER/"
cp "$GIT_ROOT/maps_config.env" "$WORKING_PUSH_FOLDER/"

# Copy GAS-safe output except for SettingsDialogCode.js and FilterUICode.js
shopt -s extglob
cp "$BUILD_DIR"/!(*SettingsDialogCode|*FilterUICode).js "$WORKING_PUSH_FOLDER/"
shopt -u extglob

# ✅ Copy unit-testable FormValidation.js (non-webpacked)
if [[ -f "$UNIT_TESTABLE_DIR/FormValidation.js" ]]; then
  echo "📦 Copying unit-testable FormValidation.js"
  cp "$UNIT_TESTABLE_DIR/FormValidation.js" "$WORKING_PUSH_FOLDER/"
else
  echo "⚠️  FormValidation.js not found in $UNIT_TESTABLE_DIR"
  exit 1
fi


cp "$BUILD_DIR/FilterUI.html" "$WORKING_PUSH_FOLDER/"
cp "$BUILD_DIR/SettingsDialog.html" "$WORKING_PUSH_FOLDER/"


echo "🚀 Pushing project to Apps Script"
$LOCAL_CLASP push --force

echo "🏁 Running initSetup"
npx --yes @google/clasp@2.4.0 run initSetup | grep INIT
if [ "$?" != "0" ] ; then 
  echo "❌ remote exec of initialization script failed"
  exit 1
fi

echo "✅ Done syncing and deploying from working folder $WORKING_PUSH_FOLDER"

