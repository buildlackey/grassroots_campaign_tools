#!/usr/bin/env bash
set -euo pipefail

# === Function to check if the user is logged in ===
check_login() {
  if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ No active account found. Please log in."
    gcloud auth login
  fi
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

# === Create the new project ===
echo "Creating Google Cloud project: $PROJECT_ID..."
if ! gcloud projects create "$PROJECT_ID"; then
  echo "❌ Failed to create project: $PROJECT_ID"
  exit 1
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


for API in "${APIS[@]}"; do
  echo "🔌 Enabling $API..."
  gcloud services enable "$API" --project="$PROJECT_ID" --quiet
done

# === Save config to file ===
CONFIG_FILE="maps_config.env"
echo "PROJECT_ID=\"$PROJECT_ID\"" > "$CONFIG_FILE"
echo "💾 Saved project ID to $CONFIG_FILE"

echo "✅ Project $PROJECT_ID created, fully unlocked, and ready for downstream setup."

