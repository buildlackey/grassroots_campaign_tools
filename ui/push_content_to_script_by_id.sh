#!/usr/bin/env bash
set -euo pipefail

GIT_ROOT="$(git rev-parse --show-toplevel)"
CONFIG_FILE="$GIT_ROOT/maps_config.env"
UI_DIR="$GIT_ROOT/ui"

# Load SCRIPT_ID and MAPS_API_KEY from env file
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "❌ Missing config file: $CONFIG_FILE"
  exit 1
fi

source "$CONFIG_FILE"

if [[ -z "${SCRIPT_ID:-}" || -z "${MAPS_API_KEY:-}" ]]; then
  echo "❌ SCRIPT_ID or MAPS_API_KEY not set in $CONFIG_FILE"
  exit 1
fi

# Create temp working dir
TMP_DIR="$(mktemp -d /tmp/clasp_push_XXXX)"
echo "🚧 Working in: $TMP_DIR"

# Clone the script project
cd "$TMP_DIR"
echo "📥 Cloning script ID: $SCRIPT_ID"
clasp clone "$SCRIPT_ID" >/dev/null

# Copy local UI files into temp project
echo "📦 Copying files from $UI_DIR"
cp "$UI_DIR"/*.{js,gs,html} "$TMP_DIR" 2>/dev/null || echo "⚠️ No matching files to copy."

# Write temporary setApiKey function
echo "🛠️ Creating temporary Init.js with setApiKey()"
cat <<EOF > "$TMP_DIR/Init.js"
function setApiKey() {
  const key = "${MAPS_API_KEY}";
  PropertiesService.getScriptProperties().setProperty("GOOGLE_MAPS_API_KEY", key);
  Logger.log("✅ Script property set.");
}
EOF

# Push to Apps Script
echo "🚀 Pushing updated code to Google..."
clasp push

echo "✅ Push complete!"
echo "🧭 View in editor: https://script.google.com/home/projects/$SCRIPT_ID/edit"

echo -e "\n⚠️ Now open the script editor and run the function: setApiKey()\n"

