#!/usr/bin/env bash
set -euo pipefail

# 🟢 Accept PROJECT_ID as a positional argument
if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <PROJECT_ID>"
  exit 1
fi

PROJECT_ID="$1"

# 🔍 Derive PROJECT_NUMBER from PROJECT_ID
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" \
  --format="value(projectNumber)")

# 💬 For logging clarity
echo "🛠️  Using PROJECT_ID=$PROJECT_ID and PROJECT_NUMBER=$PROJECT_NUMBER"



# Color formatting
BOLD=$(tput bold)
RESET=$(tput sgr0)
GREEN=$(tput setaf 2)
# 📌 GCP configuration
SCRIPT_TITLE="Weds Container Bound Smoke Test"

echo "📦 Initializing npm and clasp@2.5.0 for creation and push..."
rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"
cd "$WORKDIR"
npm init -y >/dev/null
npm install --save-dev @google/clasp@2.5.0 >/dev/null
npx --yes @google/clasp@2.5.0 login


echo "🧾 Creating new container-bound Sheet and bound Apps Script..."
npx --yes @google/clasp@2.5.0 create --type sheets --title "$SCRIPT_TITLE" >/dev/null

SCRIPT_ID=$(jq -r .scriptId .clasp.json)
SHEET_ID=$(jq -r .parentId .clasp.json)
SHEET_URL="https://docs.google.com/spreadsheets/d/$SHEET_ID/edit"

echo "✅ Sheet URL: $SHEET_URL"
echo "🆔 Script ID: $SCRIPT_ID"

echo "✍️ Writing Code.js with UI + callable function..."
cat > Code.js <<'EOF'

/**
 * Creates the custom menu
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Test Menu")
    .addItem("Show Message", "showMessage")
    .addToUi();
}

/**
 * To be called from the custom menu. Shows an alert.
 */
function showMessage() {
  SpreadsheetApp.getUi().alert("✅ Hello from showMessage()");
}

/**
 * To be called using the Execution API: returns a string.
 */
function getMessage() {
  return "✅ Hello from getMessage()";
}

/**
 * To be called from the a HTTP GET request: return a JSON.
 */
function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      message: getMessage(),
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

EOF

echo "📝 Writing appsscript.json with Execution API access..."
cat > appsscript.json <<EOF
{
  "timeZone": "America/Los_Angeles",
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  "webapp": {
    "access": "ANYONE_ANONYMOUS",
    "executeAs": "USER_DEPLOYING"
  },
  "executionApi": {
    "access": "ANYONE"
  },
  "runtimeVersion": "V8"
}



EOF

echo "📤 Pushing code to script project..."
npx --yes @google/clasp@2.5.0 push

echo "⚠️ MANUAL STEP: Link script to billing-enabled GCP project"
echo "│ ${BOLD}Sheet URL:${RESET} https://docs.google.com/spreadsheets/d/$SHEET_ID/edit"
echo "🔧 Go to: Extensions → Apps Script Dashboard → Project Settings → Change GCP Project → paste: $PROJECT_NUMBER"
read -rp "📎 Press ENTER once GCP project is linked..."

echo "🚀 Deploying script as API Executable..."
npx --yes @google/clasp@2.5.0 deploy --description "weds Initial UI + API smoke deploy"

echo "📋 Verifying deployments..."
npx --yes @google/clasp@2.5.0 deployments

echo "✅ Done. Script is deployed and testable."


