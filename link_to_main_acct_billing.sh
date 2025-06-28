#!/usr/bin/env bash

# usage:   bash link_to_main_acct_billing.sh  $GOOGLE_ACCT $TEST_ACCOUNT_EMAIL $GOOGLE_ORG_ID

GOOGLE_ACCT=$1
TEST_ACCOUNT_EMAIL=$2
GOOGLE_ORG_ID=$3

# ✅ Require all 3 arguments
if [ "$#" -lt 3 ]; then
  echo "❌ ERROR: Provide your billing account ID as 1st argument, test account email as 2nd, and organization ID as 3rd."
  exit 1
fi

# ✅ Check gcloud login
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
  echo "⚠️  Not logged into gcloud. Run 'gcloud auth login' first."
  exit 1
fi

# ✅ Ensure policy admin role (for you — hardcoded)
gcloud organizations add-iam-policy-binding "$GOOGLE_ORG_ID" \
  --member="user:chris@buildlackey.com" \
  --role="roles/orgpolicy.policyAdmin"

echo "🔓 Temporarily disabling domain restriction on IAM policy bindings..."

TMP_POLICY_FILE=$(mktemp)
cat > "$TMP_POLICY_FILE" <<EOF
constraint: constraints/iam.allowedPolicyMemberDomains
listPolicy:
  allValues: ALLOW
EOF

gcloud resource-manager org-policies set-policy "$TMP_POLICY_FILE" \
  --organization="$GOOGLE_ORG_ID"

rm "$TMP_POLICY_FILE"

echo "🔗 Granting billing.user to $TEST_ACCOUNT_EMAIL on billing account $GOOGLE_ACCT..."

gcloud beta billing accounts add-iam-policy-binding "$GOOGLE_ACCT" \
  --member="user:$TEST_ACCOUNT_EMAIL" \
  --role="roles/billing.user"

echo "🔐 Re-enabling domain restriction..."

TMP_POLICY_FILE=$(mktemp)

# Build allowed domains block
VERIFIED_DOMAINS=$(gcloud domains list-user-verified --format="value(ID)" | sed 's/^/    - domain:/')

cat > "$TMP_POLICY_FILE" <<EOF
constraint: constraints/iam.allowedPolicyMemberDomains
listPolicy:
  allowedValues:
$VERIFIED_DOMAINS
EOF

gcloud resource-manager org-policies set-policy "$TMP_POLICY_FILE" \
  --organization="$GOOGLE_ORG_ID"

rm "$TMP_POLICY_FILE"

echo "✅ Done. Billing access granted and domain policy restored."

