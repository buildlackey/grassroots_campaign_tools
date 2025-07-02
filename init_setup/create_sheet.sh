
MAKE SURE TO CALL>
    bash  verify_project_ownership.sh
    as part of script.


echo https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=$PROJECT_ID

echo verify you see 'Manage'  {If not “Enable”. If not enabled, click "Enable"}.

echo https://console.cloud.google.com/apis/library/drive.googleapis.com?project=$PROJECT_ID

echo https://console.cloud.google.com/apis/library/script.googleapis.com?project=$PROJECT_ID



echo "🔐 Authenticating with extra scopes for Apps Script API..."



##  need to do the PATCH step, but before that we have to setup a test user.

✅ STEP 1: Open Your Google Cloud Console Project
Go to the Google Cloud Console.

In the top nav bar, make sure you're in the correct project (e.g. distancetools300). If not, click the dropdown and switch to it.

✅ STEP 2: Configure the OAuth Consent Screen
From the left-hand menu, go to “APIs & Services” → “OAuth consent screen”.

For User Type, choose "External" (if not already set).

Fill in required fields:

App name: something like Grassroots Campaign Tools

User support email: your Gmail (grassrootscampaign.10@gmail.com)

Developer contact email: same as above

Click Save and Continue on each section:

You can leave Scopes and Test Users empty for now (you’ll add them in the next step)

You do not need to publish the app — stay in Testing mode

✅ STEP 3: Add Yourself as a Test User
On the Test Users tab, click “Add Users”

Enter your Gmail address: grassrootscampaign.10@gmail.com

Click Save

✅ This allows you (and any other added Gmail addresses) to bypass the full OAuth verification process and still use sensitive scopes like:

`https





at this step> 
    Edit your OAuth consent screen,
    Add test users, and
    (Optionally) confirm scopes.


Adding users:

try directly typing url in browser:

https://console.cloud.google.com/apis/credentials/consent?project=distancetools300











##   PATCH things
Why We Use a PATCH Call to the Apps Script API
Google Apps Script projects are not automatically linked to a specific [Google Cloud Platform (GCP) project] when created via the Apps Script UI or clasp. By default, they are associated with an internal, hidden default project. To enable advanced Google Cloud features (e.g. billing, quotas, IAM roles, logging, API key use), you must explicitly link your Apps Script project to a visible GCP project.

This is done by associating the Apps Script project (script ID) to a GCP project (project ID) using the Apps Script REST API.


Without this association, some services (like Maps API, Gmail API, or custom OAuth flows) fail silently or give generic “not authorized” errors.

Associating the project ensures you:
    Get usage metered and billed to the correct account.
    Can access the script’s metrics, logs, and quotas in the GCP Console.
    Can apply IAM policies to restrict or delegate usage.




need special authentication...

gcloud auth application-default login \
  --scopes="https://www.googleapis.com/auth/script.projects,https://www.googleapis.com/auth/cloud-platform"

ACCESS_TOKEN=$(gcloud auth application-default print-access-token)



EXTRA API's   -- maybe important step to workaround elusive oauth screen.

gcloud services enable \
  script.googleapis.com \
  oauth2.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iamcredentials.googleapis.com \
  drive.googleapis.com \
  --project=distancetools300









