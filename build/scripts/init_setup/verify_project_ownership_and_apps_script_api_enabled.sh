############################################################################
#  USAGE:  bash verify_project_ownership_and_apps_script_api_enabled.sh
#
# Purpose:
#   Ensures that the currently active `gcloud` account has
#   sufficient permissions (Owner or Editor) on the GCP
#   project defined in `maps_config.env`.
#
# Why this matters:
#   Many gcloud operations (e.g. linking Apps Script projects,
#   enabling APIs, or using `clasp`) fail or behave
#   unpredictably when the account lacks Editor/Owner roles.
#
# Expected:
#   - A config file named `maps_config.env` in the working dir
#   - It must define `PROJECT_ID=...`
#
# Behavior:
#   - Reads the current gcloud active account
#   - Checks if the account is an Owner or Editor of PROJECT_ID
#   - Exits with an error if not
############################################################################


function assert_project_owner_or_editor() {
  local CONFIG_FILE="./maps_config.env"

  # Ensure config file exists
  if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "❌ ERROR: Config file $CONFIG_FILE not found"
    exit 1
  fi

  # Load PROJECT_ID from config file
  source "$CONFIG_FILE"

  if [[ -z "$PROJECT_ID" ]]; then
    echo "❌ ERROR: PROJECT_ID not set in $CONFIG_FILE"
    exit 1
  fi

  local ACTIVE_ACCOUNT
  ACTIVE_ACCOUNT=$(gcloud config get-value account 2>/dev/null)

  local HAS_ACCESS
  HAS_ACCESS=$(gcloud projects get-iam-policy "$PROJECT_ID" \
    --flatten="bindings[].members" \
    --format='value(bindings.role)' \
    --filter="bindings.members:user:$ACTIVE_ACCOUNT" | grep -E 'roles/(owner|editor)')

  if [[ -z "$HAS_ACCESS" ]]; then
    echo "❌ ERROR: Account $ACTIVE_ACCOUNT is not owner/editor of $PROJECT_ID"
    exit 1
  else
    echo "✅ Access verified: $ACTIVE_ACCOUNT has rights on $PROJECT_ID"
  fi
}




function assert_google_apps_scripts_api_enabled_for_user() {
    echo "🔍 Verify that Apps Script API is enabled at user level (should say 'On'):"
    echo "   👉 Open: https://script.google.com/home/usersettings"
    echo ""
    read -p "Have you enabled the Google Apps Script API? [y/N] " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "❌ Setup aborted. Please enable the API toggle and re-run."
      exit 1
    fi
    echo "✅ Proceeding with setup..."
}


assert_project_owner_or_editor

assert_google_apps_scripts_api_enabled_for_user
