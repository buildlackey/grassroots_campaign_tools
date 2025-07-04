#!/usr/bin/env bash
set -euo pipefail



PROJECT_NAME="create-sheet-shim"
SCRIPT_TITLE="Create Sheet Shim"
TMP_DIR="/tmp/${PROJECT_NAME}_$$"
FUNC_NAME="createSheetAndLogId"


#   Verify prerequisites, then copy needed clasp files
#
bash  verify_project_ownership_and_apps_script_api_enabled.sh   


mkdir -p "$TMP_DIR"
cp ~/.clasprc.json "$TMP_DIR/"
cd "$TMP_DIR"
echo "setting up shim to create sheet in  $TMP_DIR"

# 1. Create new standalone script project
clasp create --title "$SCRIPT_TITLE" --type standalone > /dev/null

# 2. Inject the createSheet function
cat > Code.js <<EOF
function ${FUNC_NAME}() {
  const sheet = SpreadsheetApp.create("Campaign Autocomplete Sheet");
  Logger.log("✅ Created sheet: " + sheet.getUrl());
}
EOF

exit 
# 3. Push code to Apps Script project
clasp push > /dev/null



exit 

# 1. Create new standalone script project
clasp create --title "$SCRIPT_TITLE" --type standalone > /dev/null

# 2. Inject the createSheet function
cat > Code.js <<EOF
function ${FUNC_NAME}() {
  const sheet = SpreadsheetApp.create("Campaign Autocomplete Sheet");
  Logger.log("✅ Created sheet: " + sheet.getUrl());
}
EOF





exit 

echo https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=$PROJECT_ID

echo verify you see 'Manage'  {If not “Enable”. If not enabled, click "Enable"}.

echo https://console.cloud.google.com/apis/library/drive.googleapis.com?project=$PROJECT_ID

echo https://console.cloud.google.com/apis/library/script.googleapis.com?project=$PROJECT_ID



echo "🔐 Authenticating with extra scopes for Apps Script API..."














need special authentication...

gcloud auth application-default login \
  --scopes="https://www.googleapis.com/auth/script.projects,https://www.googleapis.com/auth/cloud-platform"

ACCESS_TOKEN=$(gcloud auth application-default print-access-token)



EXTRA API's   -- maybe important step to workaround elusive oauth screen.

gcloud services enable \
  script.googleapis.com \
  oauth2.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iamcredentials.googleapis.com \
  drive.googleapis.com \
  --project=distancetools300









