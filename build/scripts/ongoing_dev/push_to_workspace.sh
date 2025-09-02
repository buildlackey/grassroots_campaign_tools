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
GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
COMMON_SCRIPTS_DIR=$GIT_ROOT/build/scripts/common
BUILD_UI_DIR="$GIT_ROOT/build/ui"
BUILD_GAS_DIR="$GIT_ROOT/build/gas"
BUILD_COMMON_DIR="$GIT_ROOT/build/common"

.  "$COMMON_SCRIPTS_DIR/utils.sh"

# Login and verify we are properly logged in
$LOGIN_SCRIPT_DIR/clasp_login.sh
"$LOCAL_CLASP" login --status >/dev/null || { echo "❌ clasp status failed "; exit 1; }


cd "$GIT_ROOT"

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
}

build_common() {
  if [[ -d "$BUILD_COMMON_DIR" ]]; then
    echo "🔧 Building Common from: $BUILD_COMMON_DIR"
    cd "$BUILD_COMMON_DIR"
    [[ -d node_modules ]] || npm install
    npm run dist
  else
    echo "⚠️ Skipping Common: directory not found at $BUILD_COMMON_DIR"
  fi
}

# === Build selected targets ===
case "$TARGET" in
  ui)
    build_ui
    ;;
  gas)
    build_gas
    ;;
  common)
    build_common
    ;;
  all)
    build_ui
    build_gas
    build_common
    ;;
  *)
    echo "❌ Unknown target: $TARGET (expected ui|gas|common|all)"
    exit 1
    ;;
esac

# === Stage & Push ===
echo "🚧 Working in: $WORKING_PUSH_FOLDER"
cd "$WORKING_PUSH_FOLDER"

# 1) Validate scriptId alignment
CLASP_SCRIPT_ID=$(jq -r '.scriptId' .clasp.json)
if [[ "$CLASP_SCRIPT_ID" != "$SCRIPT_ID" ]]; then
  echo "❌ .clasp.json scriptId ($CLASP_SCRIPT_ID) does not match expected ($SCRIPT_ID)"
  exit 1
fi

# 2)  Need run time V8 in  appsscript.json to ensure latest java script syntax respected
cat > $WORKING_PUSH_FOLDER/appsscript.json <<END
{
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "executionApi": {
    "access": "ANYONE"
  }
}
END

# 3) 🔑 Inject real Maps API key into Code.js (placeholder "GOOGLE_MAPS_API_KEY")
#    Only touch Code.js in the staging folder right before push.
sed -i "s|\"GOOGLE_MAPS_API_KEY\"|\"${GOOGLE_MAPS_API_KEY}\"|g" "$WORKING_PUSH_FOLDER/Code.js"

# 4) Push
echo "🚀 Pushing project to Apps Script"
"$LOCAL_CLASP" push --force

# 5) Optional remote smoke test
echo "🏁 Running remote smokeTest (expects SUCCESS)"
if "$LOCAL_CLASP" run smokeTest | grep -q SUCCESS; then
  echo "✅ smoke test passed"
else
  echo "❌ smoke test failed"
  exit 1
fi
