#  Assumes we have CONFIG_FILE path (to maps_config.env) set up
#

# Standard init entry point
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

# === Load config ===
CONFIG_FILE=$PROJECT_ROOT/maps_config.env
[[ -f "$CONFIG_FILE" ]] || { echo "❌ Missing config: $CONFIG_FILE"; exit 1; }
source $CONFIG_FILE

# Project-level clasp (root install)
LOCAL_CLASP="$PROJECT_ROOT/node_modules/.bin/clasp"
echo "🔧 Using clasp from: $LOCAL_CLASP"
[[ -x "$LOCAL_CLASP" ]] || { echo "❌ Local clasp not found at $LOCAL_CLASP"; exit 1; }
"$LOCAL_CLASP" --version

## UTIL FUNCTIONS
update_env_var() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$CONFIG_FILE"; then
    sed -i "s|^${key}=.*|${key}=\"${value}\"|" "$CONFIG_FILE"
  else
    echo "${key}=\"${value}\"" >> "$CONFIG_FILE"
  fi
}

# === Ensure clasp login (pinned to 2.5.0, simple) ===
ensure_clasp_login() {
  set -euo pipefail

  # Preconditions
  : "${WORKING_PUSH_FOLDER:?WORKING_PUSH_FOLDER not set}"
  : "${LOCAL_CLASP:?LOCAL_CLASP not set}"
  : "${OAUTH_CLIENT_SECRET_PATH:?OAUTH_CLIENT_SECRET_PATH not set}"
  [[ -x "$LOCAL_CLASP" ]] || { echo "❌ LOCAL_CLASP not executable: $LOCAL_CLASP"; exit 1; }
  [[ -f "$OAUTH_CLIENT_SECRET_PATH" ]] || { echo "❌ Missing creds: $OAUTH_CLIENT_SECRET_PATH"; exit 1; }
  [[ -f "$WORKING_PUSH_FOLDER/.clasp.json" ]] || { echo "❌ $WORKING_PUSH_FOLDER/.clasp.json missing"; exit 1; }

  echo "🔐 Checking clasp login (2.5.0)…"
  if "$LOCAL_CLASP" login --status >/dev/null 2>&1; then
    echo "✅ clasp already logged in"
    return 0
  fi

  echo "🔓 Not logged in — logging in via creds…"
  pushd "$WORKING_PUSH_FOLDER" >/dev/null
  $LOCAL_CLASP login --creds "$OAUTH_CLIENT_SECRET_PATH" || true

  # If login wrote a local rc, promote to global so future runs work from anywhere
  if [[ -f ".clasprc.json" ]]; then
    cp ".clasprc.json" "$HOME/.clasprc.json"
    command -v jq >/dev/null 2>&1 && \
      jq '.isLocalCreds=false' "$HOME/.clasprc.json" > "$HOME/.clasprc.json.tmp" && \
      mv "$HOME/.clasprc.json.tmp" "$HOME/.clasprc.json"
  fi
  popd >/dev/null

  # Final check
  if ! "$LOCAL_CLASP" login --status >/dev/null 2>&1; then
    echo "❌ clasp login still not valid. Make sure the browser flow completed."
    exit 1
  fi
  echo "✅ clasp login ready"
}


ensure_logged_in() {
  source $CONFIG_FILE
  [[ -z "$OAUTH_CLIENT_SECRET_PATH" ||  -z "$PROJECT_ID" ]] && {
    echo "❌ Could not extract PROJECT_ID or OAUTH_CLIENT_SECRET_PATH from $CONFIG_FILE"
    exit 1
  }

  echo "🔐 Checking gcloud login..."
  if ! gcloud auth list --format="value(account)" | grep -q .; then
    echo "🔓 Not logged in to gcloud — invoking login..."
    gcloud auth login
  else
    echo "✅ Already logged in to gcloud"
  fi

  echo "🔐 Checking clasp login..."
  if [[ ! -f "$HOME/.clasprc.json" ]]; then
    echo "🔓 Not logged in to clasp — invoking login in a 'clean room' throw away folder"

    export LOGIN_TMP_DIR=$(mktemp -d -t clasp_token_XXXXXX)
    cd $LOGIN_TMP_DIR
    echo '{}' > package.json
    echo '{}' > appsscript.json
    cat <<EOF > .clasp.json
    {
      "scriptId": "PLACE_HOLDER_SCRIPT_ID",
      "projectId": "$PROJECT_ID"
    }
EOF

    "$LOCAL_CLASP" login --creds "$OAUTH_CLIENT_SECRET_PATH" || true    # even if success returns w/ non-0 return code

    if [[ ! -f "$HOME/.clasprc.json" ]]; then
      echo "🔓 due to bug, need to copy to missing $HOME/.clasprc.json"
      cp `pwd`/.clasprc.json $HOME/.clasprc.json
    fi
    "$LOCAL_CLASP" login --status >/dev/null || { echo "❌ clasp status failed after login"; exit 1; }
  else
    echo "✅ Already logged in to clasp"
  fi
}

