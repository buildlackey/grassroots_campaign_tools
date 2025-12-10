# Initial Setup


The initialization process for a brand-new Google Cloud + Apps Script development environment involves several 
steps that Google intentionally blocks from full automation. These steps require a human developer to 
interact through the web UI because they involve:

- Billing authorization
- Identity confirmation
- OAuth credentials
- Sensitive permissions
- Consent and legal acknowledgement

These are deliberately not automatable for security and compliance reasons.


## Overview

- Install dependencies: node and Google Cloud SDK/CLI if not already installed
- Create 'throw away' Google account for development and testing
- Following latest Google guidance, enable the service API used by your add-on.
  (For example: [these instructions](https://developers.google.com/maps/get-started) for maps.



## Dependencies Set-up

Install 
- [Node.js](https://nodejs.org/en/download/)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)



## Create New Google account for Development

We recommend creating a dedicated new 'throw away' Google account for development and testing
if you wish to avoid contaminating your main Google account with test projects and billing configuration.
A dedicated development account ensures clean permissions, no stale OAuth tokens, and consistent behavior across developers.
Beware that Google may impose limits on the number of new accounts that can be created from 
a single IP address or cellular number in a given time period.


###  Sign up

1. Go to: https://accounts.google.com/signup and create a new Google account.

   Options:
    - Create a standard Gmail account, or
    - Create a Google account using an existing email (both are OK for development).

2. After creation, verify:
    - Your account's recovery email
    - Your phone number (required by metered API usage billing in some flows)

3. Enable 2‑Step Verification (Required)
    - Open: https://myaccount.google.com/security
    - Enable **2‑Step Verification**
    - Create backup codes (recommended)

   Note: Google enforces 2‑step verification for metered API-enabled projects.

####  Log into the Google Cloud Console

- Open: https://console.cloud.google.com/
- On first login Google will:
    - Ask you to accept the Terms of Service
    - Ask your country and purpose of usage
    - Possibly prompt for payment setup (you can skip this for now)

####   Add a Billing Account (Required for Maps and other paid APIs)

1. Open: https://console.cloud.google.com/billing
2. Choose: **Create Billing Account**
3. Complete the form:
    - Enter your name
    - Enter credit card information
    - Verify address
    - Accept terms
4. Make a note of your *billing account ID*.

####   Set up Quotas and Budget Alerts (Optional, but Recommended)

This discussion assumes you are using Google Maps APIs, but similar steps apply to other paid Google APIs.

1. Open the Google Cloud Console [Quotas page](https://console.cloud.google.com/iam-admin/quotas)
   
   Make sure the correct project is selected (the one that owns your Maps API key).

2. Filter by Maps Platform APIs  
   In the filter box at the top, type any of:
    - `Places API`
    - `Geocoding API`
    - `Maps JavaScript API`
    - `Distance Matrix API`  
      Or simply enter: `maps`  
      You will see a list of quota metrics for the selected APIs.

3. Select the APIs / metrics you want to limit  
   Use the checkboxes to select metrics such as:
    - Requests per day
    - Requests per minute
    - Requests per minute per user

4. Click **EDIT QUOTAS** (top-right)  
   Google will prompt for:
    - Contact information
    - Business justification (freeform text is fine for limiting usage)

   Enter the new caps (examples shown below).

   Example (Default → Safe setting):

   | API | Default (Requests/day) | Example Safe Setting |
      | --- | ----------------------: | -------------------: |
   | Geocoding API | 100,000 | 5,000 |
   | Places API    | 150,000 | 3,000 |
   | Distance Matrix API | 100,000 | 2,000 |

5. Submit the change
    - Daily quota reductions are usually approved quickly.
    - Increasing quotas may require approval; lowering quotas does not.

Optional — Set a hard billing cap (advanced)
- Google doesn't provide a one-click "turn off billing" toggle, but you can create automated rules to disable Maps APIs if spend exceeds a threshold.

Steps:
1. Open Google Cloud Billing: `https://console.cloud.google.com/billing`
2. Go to **Budgets & alerts** and click **Create budget**
    - Set an amount (for example, `$10/month`)
    - Add alert thresholds (e.g., 50%, 90%, 100%)


### Create New Project and Enable Required APIs

Run [this script](../init_setup/billing_linked_new_project.sh) witht the parameters -p <new-project-id> -b <billing-account-id>, where billing account id is the one created above.
This is step  creates a new Google Cloud project, with which our runtime code will be associated.
The Project ID is the anchor identity of your entire development environment.
Nearly every Google API call, deployment operation, and credential you use ultimately maps back to this ID.

In our build system, the Project ID plays a central and non-optional role, representing:

- the name of the Google Cloud container that owns all resources
- the identity used when enabling APIs (Maps, Drive, Script)
- the bucket that holds billing associations
- the parent for OAuth clients
- the project where Apps Script executions are billed
- the place where error logs (Stackdriver) are written
- the identity that clasp uses when pushing code
- the resource used by Execution API remote calls


### Create New Spreadsheet: Your Workplace for Development

Run [this script](../ongoing_dev/new_workspace.sh) to create a clean, isolated Google Sheets environment 
where your add-on extension can be deployed, pushed, and executed.

### Manually Link Your Newly Created Project to the New Spreadsheet 


After the Sheet + Script project is created, you must:
1. Open the Sheet URL in a browser
2. Go to Extensions > Apps Script
3. Click the gear icon in the Apps Script editor
4. Under "Google Cloud Platform (GCP) Project", click "Change project"
5. Paste in the project number from your maps_config.env

You will now have a ready-to-use Sheet + Script container project that can be pushed to via `clasp push` and invoked interactively in the browser.

