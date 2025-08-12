#  run as . full_log_out.sh
export GOOGLE_APPLICATION_CREDENTIALS=
gcloud auth revoke --all
rm -f service-account-key.json 
gcloud config unset account
gcloud config unset project
rm -rf ~/.config/gcloud
rm -f ~/.config/gcloud/application_default_credentials.json

rm -rf ~/.mozilla/firefox
rm -rf ~/.cache/mozilla/firefox

npx --yes @google/clasp@2.4.2 logout
rm -f ~/.clasprc.json       # <- This is clasp’s global auth token
rm -rf ~/.clasp-*           # <- In case of clasp env profiles (not always present)


