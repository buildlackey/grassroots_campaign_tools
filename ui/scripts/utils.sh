#  Assumes we have CONFIG_FILE path (to maps_config.env) set up
#

ensure_logged_in() {


  source $CONFIG_FILE 
  [[ -z "$OAUTH_CLIENT_SECRET_PATH" ||  -z "$PROJECT_ID" ]] && {
      echo "❌ Could not extract scriptId OAUTH_CLIENT_SECRET_PATH from $CONFIG_FILE"
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

    npx --yes @google/clasp@2.5.0 login --creds  $OAUTH_CLIENT_SECRET_PATH   || true    # even if success returns w/ non-0 return code

    if [[ ! -f "$HOME/.clasprc.json" ]]; then
        echo "🔓 due to bug, need to copy to missing $HOME/.clasprc.json"
        cp `pwd`/.clasprc.json $HOME/.clasprc.json
    fi

  else
    echo "✅ Already logged in to clasp"
  fi
}

update_env_var() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$CONFIG_FILE"; then
    sed -i "s|^${key}=.*|${key}=\"${value}\"|" "$CONFIG_FILE"
  else
    echo "${key}=\"${value}\"" >> "$CONFIG_FILE"
  fi
}

