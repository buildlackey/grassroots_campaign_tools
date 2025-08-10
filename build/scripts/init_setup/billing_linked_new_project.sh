#!/usr/bin/env bash
########################################################################################
# billing_linked_new_project.sh
#
# Purpose:
#
#   This is the first step in setting up a development environment: creates
#   the new Google Cloud project with which our runtime code will be associated.
#
#   We enable test users by setting up an oauth client for this project, 
#   and we we link our billing account -- a must if we want our 
#   code to invoke any of Google's metered for-pay services.
#
#   Grants required owner roles, enables APIs for the project, 
#   and validates readiness.
#
# Usage:
#   ./billing_linked_new_project.sh -p <project-id> -b <billing-account-id>
########################################################################################

# === Poll for API readiness ===
poll_api_ready() {
  local API="$1"
  local RETRIES=10
  local DELAY=5
  echo "⏳ Polling for $API to become active..."
  for i in $(seq 1 "$RETRIES"); do
    if gcloud services list --enabled --project="$PROJECT_ID" \
         --filter="config.name:$API" \
         --format="value(config.name)" | grep -q "$API"; then
      echo "✅ $API is now enabled and available."
      return 0
    fi
    echo "⏱️  Attempt $i/$RETRIES: $API not ready yet... waiting $DELAY sec"
    sleep "$DELAY"
  done
  echo "❌ Timeout: $API did not become ready after $((RETRIES * DELAY)) seconds."
  return 1
}




set -euo pipefail



# === Function to check if the user is logged in ===
check_login() {
  if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ No active account found. Please log in."
    gcloud auth login
  fi
}

# === Poll for API readiness ===
poll_api_ready() {
  local API="$1"
  local RETRIES=10
  local DELAY=5
  echo "⏳ Polling for $API to become active..."
  for i in $(seq 1 "$RETRIES"); do
    if gcloud services list --enabled --project="$PROJECT_ID" \
         --filter="config.name:$API" \
         --format="value(config.name)" | grep -q "$API"; then
      echo "✅ $API is now enabled and available."
      return 0
    fi
    echo "⏱️  Attempt $i/$RETRIES: $API not ready yet... waiting $DELAY sec"
    sleep "$DELAY"
  done
  echo "❌ Timeout: $API did not become ready after $((RETRIES * DELAY)) seconds."
  return 1
}

# === Check if user is logged in ===
check_login

# Parse command-line arguments
while getopts "p:b:" opt; do
  case "$opt" in
    p) PROJECT_ID="$OPTARG" ;;
    b) BILLING_ID="$OPTARG" ;;
    *) echo "Usage: $0 -p <project-id> -b <billing-id>"; exit 1 ;;
  esac
done

# Check if both arguments are provided
if [ -z "${PROJECT_ID:-}" ] || [ -z "${BILLING_ID:-}" ]; then
  echo "❌ Both PROJECT_ID and BILLING_ID are required."
  echo "Usage: $0 -p <project-id> -b <billing-id>"
  exit 1
fi

# Warn if project ID already exists
if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
  echo "❌ Project ID '$PROJECT_ID' already exists. Choose a different one."
  exit 1
fi

# === Create the new project ===
echo "Creating Google Cloud project: $PROJECT_ID..."
if ! gcloud projects create "$PROJECT_ID"; then
  echo "❌ Failed to create project: $PROJECT_ID"
  exit 1
fi

# Grant owner permissions to yourself
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="user:chris@buildlackey.com" \
  --role="roles/owner"

echo "🔍 Verifying ownership for user: chris@buildlackey.com ... should say: roles/owner"
gcloud projects get-iam-policy "$PROJECT_ID" \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:chris@buildlackey.com" \
  --format="table(bindings.role)" 

echo "🔐 Checking Application Default Credentials (ADC)..."
if ! gcloud auth application-default print-access-token &>/dev/null; then
  echo "🔑 Setting up Application Default Credentials..."
  gcloud auth application-default login
fi


# === Set the active project ===
echo "Setting active project to: $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# === Link the billing account to the new project ===
echo "Linking billing account: $BILLING_ID to project $PROJECT_ID..."
if ! gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ID"; then
  echo "❌ Failed to link billing account $BILLING_ID"
  exit 1
fi

# === Grant OWNER permissions to the active user ===
ACCOUNT=$(gcloud config get-value account)
echo "🔓 Granting OWNER role to $ACCOUNT..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="user:$ACCOUNT" \
  --role="roles/owner"

# === Enable APIs .. very permissive for prototyping ===
echo "🔌 Enabling essential APIs..."
APIS=(
  sheets.googleapis.com
  drive.googleapis.com
  script.googleapis.com
  places-backend.googleapis.com
  maps-backend.googleapis.com
  geocoding-backend.googleapis.com
  cloudresourcemanager.googleapis.com
  serviceusage.googleapis.com
  iam.googleapis.com
  appsmarket-component.googleapis.com
  calendar-json.googleapis.com
  people.googleapis.com
  gmail.googleapis.com
  admin.googleapis.com
  forms.googleapis.com
)

# === Enable all in parallel ===
for API in "${APIS[@]}"; do
  echo "🚀 Enabling $API..."
  gcloud services enable "$API" --project="$PROJECT_ID" --quiet &
done
wait

# === Poll each for readiness ===
for API in "${APIS[@]}"; do
  poll_api_ready "$API" || exit 1
done


# === Fix Application Default Credentials (ADC) quota project mismatch ===
echo "🔧 Setting ADC quota project to: $PROJECT_ID..."
gcloud auth application-default set-quota-project "$PROJECT_ID"



# === Save config to file ===
CONFIG_FILE="maps_config.env"
echo "PROJECT_ID=\"$PROJECT_ID\"" >> "$CONFIG_FILE"
echo "💾 Saved project ID to $CONFIG_FILE"


PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)" 2>/dev/null)
echo "PROJECT_NUMBER=\"$PROJECT_NUMBER\"" >> "$CONFIG_FILE"

if [[ -n "$PROJECT_NUMBER" ]]; then
    echo "✅ Project number: $PROJECT_NUMBER"
else
    echo "❌ Failed to retrieve project number. Check if the project ID is valid and accessible."
fi

echo THIS PART NOT COMPLETELY TESTED 
MAPS_KEY_URL=https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID
echo "Retrieve your Maps API key (or if needed, generate a new one) from this link: $MAPS_KEY_URL"
read -rp "Enter MAPS API key> " MAPS_API_KEY
echo "MAPS_API_KEY=\"$MAPS_API_KEY\"" >> "$CONFIG_FILE"


URL=https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID
URL2=https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID
echo "Now, Set up an oauth client. Add whichever Google account you are logged in as a test user"
echo "Use this URL: $URL"
echo "Enter the exact file path of your downloaded oauth client secret"
echo "Note that there are glitches in the Google UI that prevent downloading Json"
echo "If you have trouble, consider going to this alternate URL: $URL2"
read -rp "Enter OAUTH_client secret path> " OAUTH_CLIENT_SECRET_PATH
echo "OAUTH_CLIENT_SECRET_PATH=\"$OAUTH_CLIENT_SECRET_PATH\"" >> "$CONFIG_FILE"


echo "✅ Project $PROJECT_ID created, fully unlocked, and ready for downstream setup."

