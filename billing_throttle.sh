#!/usr/bin/env bash

set -euo pipefail

# ✅ USAGE:
# bash billing_throttle.sh $GOOGLE_PROJ_ID $GOOGLE_ACCT

# ✅ Validate input
if [ $# -lt 1 ]; then
  echo "❌ ERROR: Missing project ID"
  echo "Usage: bash billing_throttle.sh <GOOGLE_PROJ_ID>"
  exit 1
fi

GOOGLE_PROJ_ID="$1"
GOOGLE_ACCT="018CCB-B8FEF0-4DCBEC"

# ✅ Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
  echo "⚠️  No active gcloud session found."
  read -p "👉 Do you want to run 'gcloud auth login' now? [Y/n]: " reply
  if [[ "${reply,,}" =~ ^(y|yes)?$ ]]; then
    gcloud auth login
  else
    echo "❌ Aborting — authentication is required."
    exit 1
  fi
fi

ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
echo "🔐 Authenticated as: $ACCOUNT"

# ✅ Link project to billing account
echo "🔗 Linking project '$GOOGLE_PROJ_ID' to billing account '$GOOGLE_ACCT'..."
gcloud beta billing projects link "$GOOGLE_PROJ_ID" --billing-account="$GOOGLE_ACCT"

# ✅ Create budget
echo "💰 Creating \$5 budget with alerts at 50% and 100%..."


gcloud alpha billing budgets create \
  --billing-account="$GOOGLE_ACCT" \
  --display-name="Test Limit" \
  --budget-amount=5USD \
  --threshold-rule="percent=0.5" \
  --threshold-rule="percent=1.0" \
  --format=json



echo "✅ Billing linked and budget created successfully."

