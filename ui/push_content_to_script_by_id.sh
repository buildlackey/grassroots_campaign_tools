#!/usr/bin/env bash
set -euo pipefail

# 🔁 Force logout of all credentials before continuing
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🚪 Forcing logout of all previous credentials..."
bash "$SCRIPT_DIR/../init_setup/full_log_out.sh"

GIT_ROOT="$(git rev-parse --show-toplevel)"
CONFIG_FILE="$GIT_ROOT/maps_config.env"
UI_DIR="$GIT_ROOT/ui"

# Load config
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "❌ Missing config file: $CONFIG_FILE"
  exit 1
fi

source "$CONFIG_FILE"

if [[ -z "${SCRIPT_ID:-}" || -z "${MAPS_API_KEY:-}" || -z "${PROJECT_ID:-}" ]]; then
  echo "❌ SCRIPT_ID, MAPS_API_KEY, or PROJECT_ID not set in $CONFIG_FILE"
  exit 1
fi

# Re-authenticate clasp
echo "🔐 Logging in to clasp..."
clasp login

# Re-authenticate gcloud CLI
echo "🔐 Logging in to gcloud..."
gcloud auth login

# ✅ Set project for ADC flow before login
echo "🧾 Pre-setting project for ADC..."
gcloud config set project "$PROJECT_ID"

# ✅ Remove stale ADC token before new login
echo "🧹 Clearing old ADC token..."
rm -f "$HOME/.config/gcloud/application_default_credentials.json"

# ✅ Login to ADC with correct project context
echo "🔐 Logging in to Application Default Credentials (ADC)..."
gcloud auth application-default login

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

# Inject Init.js to set API key
echo "🛠️ Creating temporary Init.js with setApiKey()"
cat <<EOF > "$TMP_DIR/Init.js"
function setApiKey() {
  const key = "${MAPS_API_KEY}";
  PropertiesService.getScriptProperties().setProperty("GOOGLE_MAPS_API_KEY", key);
  Logger.log("✅ Script property set.");
}
EOF

# Push full project (including Init.js)
echo "🚀 Pushing code to Google..."
clasp push

# Manual follow-up instructions
echo ""
echo "⚠️  Remote execution was skipped to avoid fragile auth problems."
echo "🔧 You must now manually open Init.js & run 'setApiKey()' ONCE in Script Editor:"
echo ""
echo "🔗 https://script.google.com/home/projects/$SCRIPT_ID/edit"
echo "→ Select function: setApiKey"
echo "→ Click ▶ Run (in editor)"
echo ""
read -rp "✅ Press ENTER after you’ve done this..."

# Clean up Init.js and re-push to remove the key from source
echo "🧹 Cleaning up Init.js and re-pushing"
rm -f "$TMP_DIR/Init.js"
clasp push

echo ""
echo "✅ All done!"
echo "🧭 View your script: https://script.google.com/home/projects/$SCRIPT_ID/edit"


