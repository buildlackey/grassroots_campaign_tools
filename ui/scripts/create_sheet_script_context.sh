###############################################################################
# Script: create_sheet_script_context.sh
#
# Purpose:
#   Creates a new Google Sheet and binds a Google Apps Script (GAS)
#   project to it, and creates a new tmp staging folder from which transpiled, 
#   gas-ified Javascript code can  be pushed to the GAS cloud environment to be run/tested.
#
#
# Prerequisite:
#   - Step 1 must have already been completed:
#       ./init_setup/billing_linked_new_project.sh
#     This ensures a Google Cloud project exists and is linked to billing.
#
# Behavior:
#   - Logs out of any prior gcloud / clasp state to ensure a clean environment
#   - Creates a temporary working folder for staging deployment artifacts
#   - Authenticates clasp with the correct credentials
#   - Uses clasp to create a new container-bound Apps Script project linked to
#     a fresh spreadsheet
#   - Extracts and stores metadata such as:
#       - SCRIPT_ID
#       - SHEET_URL
#       - WORKING_PUSH_FOLDER
#   - Prompts the developer to manually associate the new script with the
#     pre-existing GCP project using the UI (required by Google)
#
# Manual step required:
#   After the Sheet + Script project is created, you must:
#     1. Open the Sheet URL in a browser
#     2. Go to Extensions > Apps Script
#     3. Click the gear icon in the Apps Script editor
#     4. Under "Google Cloud Platform (GCP) Project", click "Change project"
#     5. Paste in the project number from your maps_config.env
#
# Outcome:
#   You will have a ready-to-use Sheet + Script container project that can
#   be pushed to via `clasp push` and invoked interactively in the browser.
#
#
# Safe to re-run?
#   Yes — But note that every time you run, you will have a different spreadsheet
#   where your code lives, and you will have to go to a different URL to test/debug that code
#   (check maps_config.env.)    Also note that transpiled gas-ified Javascript code 
#   will be staged to a different working folder every time you run this script.
###############################################################################



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
PROJECT_TITLE="Weds Test Sheet $(date +%s)"
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


