#!/usr/bin/env bash
set -euo pipefail

CLIENT_SECRET_JSON="${1:-$HOME/config/client_secret.json}"
REDIRECT_URI="urn:ietf:wg:oauth:2.0:oob"
SCOPES="https://www.googleapis.com/auth/script.external_request https://www.googleapis.com/auth/userinfo.email"

CLIENT_ID=$(jq -r '.installed.client_id' < "$CLIENT_SECRET_JSON")
CLIENT_SECRET=$(jq -r '.installed.client_secret' < "$CLIENT_SECRET_JSON")

AUTH_URL="https://accounts.google.com/o/oauth2/v2/auth?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code&scope=$(echo $SCOPES | sed 's/ /%20/g')&access_type=offline&prompt=consent"

echo "🌐 Visit the following URL in a browser:"
echo "$AUTH_URL"
echo
read -rp "🔐 Paste the authorization code here: " AUTH_CODE

echo "🔁 Exchanging auth code for tokens..."

RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "code=$AUTH_CODE" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "redirect_uri=$REDIRECT_URI" \
  -d "grant_type=authorization_code")

ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')
echo
echo "✅ Access token:"
echo "$ACCESS_TOKEN"

