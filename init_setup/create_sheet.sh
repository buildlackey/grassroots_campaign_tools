#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="$(git rev-parse --show-toplevel)/maps_config.env"
DEBUG=false
SHEET_NAME=""

print_help() {
  cat <<EOF
Usage: $0 -n SHEET_NAME [-D]

Options:
  -n SHEET_NAME   Required. Must be a unique, never-before-used name.
  -D              Enable debug output (traces API responses and intermediate values).
  -h              Show this help message.

Example:
  $0 -n test-sheet-$(date +%s) -D
EOF
}

while getopts ":n:Dh" opt; do
  case ${opt} in
    n)
      SHEET_NAME="$OPTARG"
      ;;
    D)
      DEBUG=true
      ;;
    h)
      print_help
      exit 0
      ;;
    \?)
      echo "❌ Invalid option: -$OPTARG" >&2
      print_help
      exit 1
      ;;
    :)
      echo "❌ Option -$OPTARG requires an argument." >&2
      print_help
      exit 1
      ;;
  esac
done

if [[ -z "$SHEET_NAME" ]]; then
  echo "❌ You must specify a sheet name with -n" >&2
  print_help
  exit 1
fi

echo "📝 Go to: https://sheets.new and create a new sheet."
echo "📛 Name it exactly: '$SHEET_NAME'"
read -p "✅ Press Enter when you're done: "

# 🔐 Ensure clasp is logged in
if ! jq -e '.tokens.default.access_token' ~/.clasprc.json >/dev/null 2>&1; then
  echo "🔐 Running clasp login..."
  clasp login
fi

# 🔑 Extract access token
ACCESS_TOKEN=$(jq -r '.tokens.default.access_token' ~/.clasprc.json)

# 🔍 Query Drive API for Sheet details
[[ "$DEBUG" == "true" ]] && echo "🔎 Searching for spreadsheet named '$SHEET_NAME'..."
SHEET_DETAILS=$(curl -s \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://www.googleapis.com/drive/v3/files?q=name%3D'${SHEET_NAME}'%20and%20mimeType%3D'application%2Fvnd.google-apps.spreadsheet'")

[[ "$DEBUG" == "true" ]] && echo "$SHEET_DETAILS" | jq

# 📥 Extract Sheet ID
SHEET_ID=$(echo "$SHEET_DETAILS" | jq -r '.files[0].id')

# 🧯 Handle not found
if [[ -z "$SHEET_ID" || "$SHEET_ID" == "null" ]]; then
  echo "❌ Could not find a spreadsheet named '$SHEET_NAME'."
  exit 1
fi

echo "✅ Found Sheet ID: $SHEET_ID"

# 🧾 Append to maps_config.env
echo "SHEET_NAME=\"$SHEET_NAME\"" >> "$CONFIG_FILE"
echo "SHEET_ID=\"$SHEET_ID\"" >> "$CONFIG_FILE"
echo "🧷 Added SHEET_NAME and SHEET_ID to $CONFIG_FILE"

