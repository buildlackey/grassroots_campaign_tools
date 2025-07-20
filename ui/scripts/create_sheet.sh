#!/usr/bin/env bash
set -euo pipefail

# === Parse args ===
DEBUG=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    -D|--debug)
      DEBUG=true
      shift
      ;;
    *)
      echo "❌ Unknown argument: $1"
      exit 1
      ;;
  esac
done

# === Auth checks ===
ensure_logged_in() {
  echo "🔐 Checking gcloud login..."
  if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "⚠️  Not logged in to gcloud. Running: gcloud auth login"
    gcloud auth login
  fi

  echo "🔐 Checking clasp login..."
  if ! jq -e '.token.access_token' ~/.clasprc.json >/dev/null 2>&1; then
    echo "⚠️  Not logged in to clasp. Running: clasp login"
    clasp login
  fi
}

ensure_logged_in

# === Paths ===
PROJECT_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
CONFIG_FILE="$PROJECT_ROOT/maps_config.env"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "❌ maps_config.env not found at: $CONFIG_FILE"
  exit 1
fi

PROJECT_TITLE="CampaignSheet-$(date +%s)"
TMP_DIR="$(mktemp -d /tmp/sheet_create_XXXX)"
echo "📁 Using temp working directory: $TMP_DIR"

cd "$TMP_DIR"

# === Create container-bound script with new Google Sheet ===
echo "📄 Running: clasp create --title \"$PROJECT_TITLE\" --type sheets"
clasp create --title "$PROJECT_TITLE" --type sheets > create.log

# === Get SCRIPT_ID from .clasp.json ===
if [[ ! -f .clasp.json ]]; then
  echo "❌ .clasp.json not found after clasp create"
  cat create.log
  exit 1
fi

SCRIPT_ID=$(jq -r '.scriptId' .clasp.json)
[[ -z "$SCRIPT_ID" || "$SCRIPT_ID" == "null" ]] && {
  echo "❌ Could not extract scriptId from .clasp.json"
  exit 1
}

# === Get SHEET_ID via Apps Script API ===
ACCESS_TOKEN=$(jq -r '.tokens.default.access_token' ~/.clasprc.json)

SCRIPT_INFO_URL="https://script.googleapis.com/v1/projects/${SCRIPT_ID}"

if [[ "$DEBUG" == true ]]; then
  echo "🐛 DEBUG MODE ENABLED"
  echo "🪪 Access token source: ~/.clasprc.json"
  echo "🔑 TOKEN (first 20 chars): ${ACCESS_TOKEN:0:20}..."
  echo "📡 CURL COMMAND:"
  echo "curl -s -H \"Authorization: Bearer <ACCESS_TOKEN>\" \"$SCRIPT_INFO_URL\""        #  redundant w/def of SCRIPT_INFO
fi

SCRIPT_INFO=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "$SCRIPT_INFO_URL")

if [[ "$DEBUG" == true ]]; then
  echo "📦 SCRIPT INFO:"
  echo "$SCRIPT_INFO" | jq
fi

SHEET_ID=$(echo "$SCRIPT_INFO" | jq -r '.parentId')
[[ -z "$SHEET_ID" || "$SHEET_ID" == "null" ]] && {
  echo "❌ Could not determine SHEET_ID from Apps Script API"
  exit 1
}

SHEET_URL="https://docs.google.com/spreadsheets/d/${SHEET_ID}"
echo "✅ SCRIPT_ID = $SCRIPT_ID"
echo "✅ SHEET_ID  = $SHEET_ID"
echo "✅ SHEET_URL  = $SHEET_URL"

# === Update maps_config.env ===
update_env_var() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$CONFIG_FILE"; then
    sed -i "s|^${key}=.*|${key}=\"${value}\"|" "$CONFIG_FILE"
  else
    echo "${key}=\"${value}\"" >> "$CONFIG_FILE"
  fi
}

echo "💾 Updating $CONFIG_FILE..."
update_env_var SCRIPT_ID "$SCRIPT_ID"
update_env_var SHEET_ID "$SHEET_ID"
update_env_var SHEET_URL "$SHEET_URL"

# === Prompt user to manually associate with real GCP project ===
echo ""
echo "⚠️  MANUAL STEP REQUIRED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "To ensure Maps API billing works, you must associate this script:"
echo "  Script Title: $PROJECT_TITLE"
echo "  Script ID:    $SCRIPT_ID"
echo ""
echo "With your real GCP project:"
echo "  GCP Project ID: $(grep PROJECT_ID "$CONFIG_FILE" | cut -d= -f2 | tr -d \")"
echo ""
echo "Open the following URL in your browser:"
echo "  https://script.google.com/d/$SCRIPT_ID/edit"
echo ""
echo "➡️  Then go to:"
echo "  Extensions > Apps Script Dashboard"
echo "  Project Settings > Google Cloud Platform (GCP) Project"
echo "  Select the option: 'Change project' and paste:"
echo "     $(grep PROJECT_ID "$CONFIG_FILE" | cut -d= -f2 | tr -d \")"
echo ""
read -rp "🛑 Press [ENTER] when you've finished associating the script to your GCP project..."


