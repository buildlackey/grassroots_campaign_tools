#!/usr/bin/env bash
set -euo pipefail

# 📌 GCP configuration
PROJECT_ID="campaigns-464120"                 # <-- Replace with yours if needed
PROJECT_NUMBER="873476896416"
SCRIPT_TITLE="Container Bound Smoke Test"
WORKDIR="/tmp/container_bound_smoke_test"

echo "📁 Cleaning and setting up workspace..."
rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

echo "📦 Initializing npm and clasp@2.5.0 for creation and push..."
npm init -y >/dev/null
npm install --save-dev @google/clasp@2.5.0 >/dev/null

echo "🧾 Creating new container-bound Sheet and bound Apps Script..."
npx --yes @google/clasp@2.5.0 create --type sheets --title "$SCRIPT_TITLE" >/dev/null

SCRIPT_ID=$(jq -r .scriptId .clasp.json)
SHEET_ID=$(jq -r .parentId .clasp.json)
SHEET_URL="https://docs.google.com/spreadsheets/d/$SHEET_ID/edit"

echo "✅ Sheet URL: $SHEET_URL"
echo "🆔 Script ID: $SCRIPT_ID"

echo "✍️ Writing Code.js with UI + callable function..."
cat > Code.js <<'EOF'
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Test Menu")
    .addItem("Show Message", "getMsg")
    .addToUi();
}

function getMsg() {
  Logger.log("✅ UI and API smoke test passed!");
  return "✅ Hello from getMsg()";
}
EOF

echo "📝 Writing appsscript.json with Execution API access..."
cat > appsscript.json <<EOF
{
  "timeZone": "America/Los_Angeles",
  "exceptionLogging": "STACKDRIVER",
  "executionApi": {
    "access": "ANYONE"
  }
}
EOF

echo "📤 Pushing code to script project..."
npx --yes @google/clasp@2.5.0 push

echo "⚠️ MANUAL STEP: Link script to billing-enabled GCP project"
echo "🔗 Open: https://script.google.com/home/projects/$SCRIPT_ID/edit"
echo "🔧 Go to: Extensions → Apps Script Dashboard → Project Settings → Change GCP Project → paste: $PROJECT_NUMBER"
read -rp "📎 Press ENTER once GCP project is linked..."

echo "🚀 Installing clasp@3.0.6-alpha for deployment..."
npm install --save-dev @google/clasp@3.0.6-alpha >/dev/null

echo "🚀 Deploying script as API Executable..."
npx --yes @google/clasp@3.0.6-alpha deploy --description "Initial UI + API smoke deploy"

echo "📋 Verifying deployments..."
npx --yes @google/clasp@3.0.6-alpha deployments

echo "🌐 You can now test the Execution API using the following curl:"
echo ""
echo "🔑 Get a valid access token first (either via gcloud or user OAuth):"
echo "    export ACCESS_TOKEN=\$(gcloud auth application-default print-access-token)"
echo ""
echo "🧪 Then run this:"
echo "curl -s -X POST \\"
echo "  -H \"Authorization: Bearer \$ACCESS_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"function\": \"getMsg\"}' \\"
echo "  \"https://script.googleapis.com/v1/scripts/$SCRIPT_ID:run\" | jq ."
echo ""
echo "🧪 Or test via clasp:"
echo "npx --yes @google/clasp@3.0.6-alpha run getMsg"
echo ""
echo "✅ Done. Script is deployed and testable."


