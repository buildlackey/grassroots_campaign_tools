#!/usr/bin/env bash
set -euo pipefail

# Parse args
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

# 🔁 Force logout of all credentials before continuing if first-time
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT="$(git rev-parse --show-toplevel)"
CONFIG_FILE="$GIT_ROOT/maps_config.env"
UI_DIR="$GIT_ROOT/ui"

if [[ "$FIRST_TIME" == true ]]; then
  echo "🚪 Forcing logout of all previous credentials..."
  bash "$SCRIPT_DIR/../init_setup/full_log_out.sh"

  echo "🔐 Logging in to clasp..."
  clasp login

  echo "🔐 Logging in to gcloud..."
  gcloud auth login

  echo "🧾 Pre-setting project for ADC..."
  source "$CONFIG_FILE"
  gcloud config set project "$PROJECT_ID"

  echo "🧹 Clearing old ADC token..."
  rm -f "$HOME/.config/gcloud/application_default_credentials.json"

  echo "🔐 Logging in to Application Default Credentials (ADC)..."
  gcloud auth application-default login
fi

# 🧾 Load config
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "❌ Missing config file: $CONFIG_FILE"
  exit 1
fi

source "$CONFIG_FILE"

if [[ -z "${SCRIPT_ID:-}" || -z "${MAPS_API_KEY:-}" || -z "${PROJECT_ID:-}" ]]; then
  echo "❌ SCRIPT_ID, MAPS_API_KEY, or PROJECT_ID not set in $CONFIG_FILE"
  exit 1
fi

# Create temp working dir
TMP_DIR="$(mktemp -d /tmp/clasp_push_XXXX)"
echo "🚧 Working in: $TMP_DIR"

# Clone script project
cd "$TMP_DIR"
echo "📥 Cloning script ID: $SCRIPT_ID"
clasp clone "$SCRIPT_ID" >/dev/null

# Copy UI files explicitly
echo "📦 Copying files from $UI_DIR"
for file in "$UI_DIR"/*.js "$UI_DIR"/*.gs "$UI_DIR"/*.html; do
  if [[ -f "$file" ]]; then
    echo "📄 Copying: $file"
    cp "$file" "$TMP_DIR/"
  fi
done

# Conditionally add Init.js if first-time
if [[ "$FIRST_TIME" == true ]]; then
  echo "🛠️  Injecting Init.js for first-time setup"
  cat <<EOF > "$TMP_DIR/Init.js"
function initialSetup() {
  const key = "${MAPS_API_KEY}";
  PropertiesService.getScriptProperties().setProperty("GOOGLE_MAPS_API_KEY", key);
  PropertiesService.getScriptProperties().setProperty("DEBUG", "false");
  Logger.log("✅ Script properties set: GOOGLE_MAPS_API_KEY + DEBUG");
}
EOF
else
  echo "🧹 Removing Init.js if it exists (not first-time run)"
  rm -f "$TMP_DIR/Init.js"
fi

echo "🚀 Pushing project to Apps Script"
clasp push

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

