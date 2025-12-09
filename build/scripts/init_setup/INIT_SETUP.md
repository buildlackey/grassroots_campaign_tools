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
- Following latest Google guidance, enable the service API used by your add-on
  e.g., for maps, [these instructions](https://developers.google.com/maps/get-started).



## Dependencies Set-up

Install 
- [Node.js](https://nodejs.org/en/download/)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)



## Create New Google account for Development

We recommend creating a dedicated new 'throw away' Google account for development and testing
if you wish to avoid contaminating your main Google account with test projects and billing configuration.
A dedicated development account ensures clean permissions, no stale OAuth tokens, and consistent behavior across developers.


### Create the Google Account

1. Go to: https://accounts.google.com/signup and create a new Google account.

   Options:
    - Create a standard Gmail account, or
    - Create a Google account using an existing email (both are OK for development).

2. After creation, verify:
    - Recovery email
    - Phone number (required by Google for Maps API / billing in some flows)

3. Enable 2‑Step Verification (Required)
    - Open: https://myaccount.google.com/security
    - Enable **2‑Step Verification**
    - Create backup codes (recommended)

   Note: Google enforces 2‑step verification for API-enabled projects and Maps billing.

#### Google Account Creation: Log into the Google Cloud Console

- Open: https://console.cloud.google.com/
- On first login Google will:
    - Ask you to accept the Terms of Service
    - Ask your country and purpose of usage
    - Possibly prompt for payment setup (you can skip this for now)

#### Google Account Creation:  Add a Billing Account (Required for Maps API)

1. Open: https://console.cloud.google.com/billing
2. Choose: **Create Billing Account**
3. Complete the form:
    - Enter your name
    - Enter credit card information
    - Verify address
    - Accept terms
4. Make a note of your billing account ID.

#### Google Account Creation:  Optional, but Recommended: Set up Quotas and Budget Alerts 

1. Open the Google Cloud Console Quotas page  
   `https://console.cloud.google.com/iam-admin/quotas`  
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

