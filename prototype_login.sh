
bash /home/chris/grassroots_campaign_tools/init_setup/full_log_out.sh

# 1. Create a temp directory
export WORK_DIR=$(mktemp -d -t clasp_login_create_XXXXXX)
cd "$WORK_DIR"
echo "📁 Using working dir: $WORK_DIR"

# 2. Create dummy files to bypass clasp internals
echo '{}' > package.json
echo '{ "scriptId": "PLACEHOLDER" }' > .clasp.json
cat > appsscript.json <<EOF
{
  "timeZone": "America/Los_Angeles",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
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
npx --yes @google/clasp@2.5.0 login --creds ~/config/client_secret.json

# 4. Promote the local .clasprc.json to global
cp .clasprc.json ~/.clasprc.json
jq '.isLocalCreds = false' ~/.clasprc.json > ~/.clasprc_tmp.json && mv ~/.clasprc_tmp.json ~/.clasprc.json

# 5. Cleanup placeholder .clasp.json to allow project creation
rm -f .clasp.json

# 6. Create a new Sheets + Apps Script container-bound project
npx --yes @google/clasp@2.5.0 create --title "My Sheet $(date +%s)" --type sheets

