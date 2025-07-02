#  run as . full_log_out.sh
export GOOGLE_APPLICATION_CREDENTIALS=
gcloud auth revoke --all
rm service-account-key.json 
gcloud config unset account
gcloud config unset project
rm -rf ~/.config/gcloud

rm -rf ~/.mozilla/firefox
rm -rf ~/.cache/mozilla/firefox

rm -f ~/.config/gcloud/application_default_credentials.json

