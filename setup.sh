#!/usr/bin/env bash


set -euo pipefail

# ✅ Require Maps API key as first argument
if [ "$#" -lt 1 ]; then
  echo "❌ ERROR: You must provide your Google Maps API key as the first argument."
  echo ""
  echo "Usage:"
  echo "  ./setup-distance-ui.sh YOUR_GOOGLE_MAPS_API_KEY"
  exit 1
fi

MAPS_API_KEY="$1"
TITLE="Distance UI $(date +%F-%H%M)"

echo "🧱 Creating spreadsheet..."
SPREADSHEET_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d "{\"properties\": {\"title\": \"$TITLE\"}}" \
  "https://sheets.googleapis.com/v4/spreadsheets")

SPREADSHEET_ID=$(echo "$SPREADSHEET_RESPONSE" | jq -r '.spreadsheetId')
echo "✅ Sheet created: https://docs.google.com/spreadsheets/d/$SPREADSHEET_ID/edit"

echo "📎 Creating bound Apps Script project..."
clasp create --type sheets --title "$TITLE" --parentId "$SPREADSHEET_ID"

echo "📤 Pushing local Apps Script files..."
clasp push

echo "🔑 Injecting API key into script properties..."
cat > setProps.js <<EOF
function setScriptProperties() {
  PropertiesService.getScriptProperties().setProperty("GOOGLE_MAPS_API_KEY", "$MAPS_API_KEY");
}
EOF

clasp push -f setProps.js

echo "⚙️ Setting API key remotely..."
clasp run setScriptProperties

rm setProps.js

echo "🚀 Done. Open your new spreadsheet:"
echo "👉 https://docs.google.com/spreadsheets/d/$SPREADSHEET_ID/edit"


echo later.. gcloud services enable sheets.googleapis.com \
    script.googleapis.com \
    drive.googleapis.com

