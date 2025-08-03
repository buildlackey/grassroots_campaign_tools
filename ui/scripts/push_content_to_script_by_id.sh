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
UI_DIR="$GIT_ROOT/code/ui"
RAW_SRC_DIR="$UI_DIR/raw"
BUILD_DIR=/home/chris/grassroots_campaign_tools/built/ui/gas_safe_staging
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

echo "🛠️  Running build...   - tmp dir change"
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
cp "$RAW_SRC_DIR"/*               "$WORKING_PUSH_FOLDER/"
cp "$BUILD_DIR"/* "$WORKING_PUSH_FOLDER/"
cp "$GIT_ROOT/maps_config.env"      "$WORKING_PUSH_FOLDER/"



echo "🚀 Pushing project to Apps Script -- going back to 2.5"
#$LOCAL_CLASP push --force
npx @google/clasp@2.5.0 push --force


echo "🏁 Running initSetup"
npx --yes @google/clasp@2.4.0 run initSetup | grep INIT
if [ "$?" != "0" ] ; then 
  echo "❌ remote exec of initialization script failed"
  exit 1
fi

echo "✅ Done syncing and deploying from working folder $WORKING_PUSH_FOLDER"

