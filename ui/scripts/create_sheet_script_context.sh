

bash /home/chris/grassroots_campaign_tools/init_setup/full_log_out.sh


CONFIG_FILE=/home/chris/grassroots_campaign_tools/maps_config.env
source $CONFIG_FILE

update_env_var() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$CONFIG_FILE"; then
    sed -i "s|^${key}=.*|${key}=\"${value}\"|" "$CONFIG_FILE"
  else
    echo "${key}=\"${value}\"" >> "$CONFIG_FILE"
  fi
}





# 1. Create WORKING_PUSH_FOLDER where built artifacts are staged then pushed
export WORKING_PUSH_FOLDER=$(mktemp -d -t clasp_login_create_XXXXXX)
cd "$WORKING_PUSH_FOLDER"
echo "📁 Using working dir: $WORKING_PUSH_FOLDER"
update_env_var WORKING_PUSH_FOLDER $WORKING_PUSH_FOLDER

# 2. Create dummy files to bypass clasp internals
echo '{}' > package.json
echo '{ "scriptId": "PLACEHOLDER", "projectId": "build-lackey-project-5" }' > .clasp.json

cat > appsscript.json <<EOF
{
  "timeZone": "America/Los_Angeles",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/script.projects",
    "https://www.googleapis.com/auth/script.deployments",
    "https://www.googleapis.com/auth/script.webapp.deploy",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/cloud-platform"
  ]
}
EOF


# 3. Login using your OAuth client secret
echo "🔐 Logging in..."
npx --yes @google/clasp@2.5.0 login --creds $OAUTH_CLIENT_SECRET_PATH


# 4. Promote the local .clasprc.json to global
cp .clasprc.json ~/.clasprc.json
jq '.isLocalCreds = false' ~/.clasprc.json > ~/.clasprc_tmp.json && mv ~/.clasprc_tmp.json ~/.clasprc.json

# 5. Cleanup placeholder .clasp.json to allow project creation
rm -f .clasp.json


# === Create the Sheet-bound Apps Script project ===
PROJECT_TITLE="Test Sheet $(date +%s)"
npx --yes @google/clasp@2.5.0 create --title "$PROJECT_TITLE" --type sheets

# === Extract script ID and save to config ===
SCRIPT_ID=$(jq -r '.scriptId' .clasp.json)

# === Get spreadsheet URL ===
PARENT_ID=$(jq -r '.parentId | if type=="array" then .[0] else . end' .clasp.json)
SHEET_URL="https://docs.google.com/spreadsheets/d/${PARENT_ID}/edit"
update_env_var SHEET_URL $SHEET_URL


# === Prompt user to manually associate script ===
echo ""
echo "⚠️  MANUAL STEP REQUIRED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "To ensure Maps API billing works, you must associate this script:"
echo "  Script Title: $PROJECT_TITLE"
echo "  Script ID:    $SCRIPT_ID"
echo ""
echo "With your real GCP project:"
echo "  GCP Project ID:     $PROJECT_ID"
echo "  GCP Project Number: $PROJECT_NUMBER"
echo ""
echo "Open the following URL in your browser:"
echo "  $SHEET_URL"
echo ""
echo "➡️  Then go to:"
echo "  Extensions > Apps Script Dashboard"
echo "  Project Settings > Google Cloud Platform (GCP) Project"
echo "  Select the option: 'Change project' and paste:"
echo "     $PROJECT_NUMBER"
echo ""
read -rp "🛑 Press [ENTER] when you've finished associating the script to your GCP project..."


