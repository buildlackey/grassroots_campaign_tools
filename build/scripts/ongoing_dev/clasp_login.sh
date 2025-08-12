SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"        # project root folder
COMMON_SCRIPTS_DIR=$SCRIPT_DIR/../common
    
.  $COMMON_SCRIPTS_DIR/utils.sh
.  $GIT_ROOT/maps_config.env

pushd $WORKING_PUSH_FOLDER

$LOCAL_CLASP login --status  | grep $USER >/dev/null 2>&1
 
if [ "$?" = "0" ] ; then 
    echo "Already logged into clasp" 
else
    cat <<EOF>appsscript.json
    {
      "timeZone": "America/Los_Angeles",
      "exceptionLogging": "STACKDRIVER",
      "runtimeVersion": "V8",
      "oauthScopes": [
        "https://www.googleapis.com/auth/script.projects",
        "https://www.googleapis.com/auth/script.deployments",
        "https://www.googleapis.com/auth/script.webapp.deploy",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/script.container.ui",
        "https://www.googleapis.com/auth/spreadsheets.currentonly"

      ]
    }
EOF

    $LOCAL_CLASP login --creds $OAUTH_CLIENT_SECRET_PATH

    # 4. Promote the local .clasprc.json to global      -- delete original rc file in curr dir?
    cp .clasprc.json ~/.clasprc.json
    jq '.isLocalCreds = false' ~/.clasprc.json > ~/.clasprc_tmp.json && \
                                        mv ~/.clasprc_tmp.json ~/.clasprc.json

    echo "Now logged into clasp" 
fi


popd

