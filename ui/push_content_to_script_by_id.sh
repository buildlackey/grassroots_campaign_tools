#!/usr/bin/env bash
set -euo pipefail

FIRST_TIME=false

# Parse flags
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -f|--first-time) FIRST_TIME=true ;;
    *) echo "❌ Unknown parameter: $1" ; exit 1 ;;
  esac
  shift
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT="$(git rev-parse --show-toplevel)"
CONFIG_FILE="$GIT_ROOT/maps_config.env"
UI_DIR="$GIT_ROOT/ui"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "❌ Missing config file: $CONFIG_FILE"
  exit 1
fi

source "$CONFIG_FILE"

if [[ -z "${SCRIPT_ID:-}" || -z "${MAPS_API_KEY:-}" || -z "${PROJECT_ID:-}" ]]; then
  echo "❌ SCRIPT_ID, MAPS_API_KEY, or PROJECT_ID not set in $CONFIG_FILE"
  exit 1
fi

if [[ "$FIRST_TIME" == true ]]; then
  echo "🚪 First-time setup mode: forcing fresh auth"
  bash "$SCRIPT_DIR/../init_setup/full_log_out.sh"

  echo "🔐 Logging in to clasp..."
  clasp login

  echo "🔐 Logging in to gcloud..."
  gcloud auth login

  echo "🧾 Setting project for ADC"
  gcloud config set project "$PROJECT_ID"

  echo "🧹 Clearing old ADC token"
  rm -f "$HOME/.config/gcloud/application_default_credentials.json"

  echo "🔐 Logging in to ADC"
  gcloud auth application-default login
fi

# Create and switch to temp working dir
TMP_DIR="$(mktemp -d /tmp/clasp_push_XXXX)"
echo "🚧 Working in: $TMP_DIR"
cd "$TMP_DIR"

echo "📥 Cloning script ID: $SCRIPT_ID"
clasp clone "$SCRIPT_ID" >/dev/null

echo "📦 Copying files from $UI_DIR"
for file in "$UI_DIR"/*.js "$UI_DIR"/*.gs "$UI_DIR"/*.html; do
  if [[ -f "$file" ]]; then
    echo "📄 Copying: $file"
    cp "$file" "$TMP_DIR/"
  fi
done

if [[ "$FIRST_TIME" == true ]]; then
  echo "🛠️ Injecting Init.js for API key setup"
  cat <<EOF > "$TMP_DIR/Init.js"
function setApiKey() {
  const key = "${MAPS_API_KEY}";
  PropertiesService.getScriptProperties().setProperty("GOOGLE_MAPS_API_KEY", key);
  Logger.log("✅ Script property set.");
}
EOF
fi

echo "🚀 Pushing project to Apps Script"
clasp push

if [[ "$FIRST_TIME" == true ]]; then
  echo ""
  echo "🔧 Please run setApiKey() ONCE in the Script Editor:"
  echo "🔗 https://script.google.com/home/projects/$SCRIPT_ID/edit"
  echo "→ Select function: setApiKey"
  echo "→ Click ▶ Run (in editor)"
  echo ""
  read -rp "✅ Press ENTER once complete..."

  echo "🧹 Removing Init.js and re-pushing"
  rm -f "$TMP_DIR/Init.js"
  clasp push
fi

echo "✅ Done."
echo "🧭 View your script: https://script.google.com/home/projects/$SCRIPT_ID/edit"

