DEVELOPER NOTES:

In order to run Google sheets extensions that invoke Google's metered for-pay services
(e.g., the Maps API), we need to create a number of 'fixtures' such as a Google Project
that has been granted requisite privileges to access those services, and an associated 
spread sheet and script context to which we can push our extension code, test it, and debug it.

For this purpose we include a number of scripts which automate the process of 
establishing these fixtures to the extent possible.   Some of the steps in 
this set-up are  only executable via the UI -- not by any CLI capabilities, by design. 
This helps prevent the construction of scripts that leak sensitive keys and credentials
into logs.  Our scripts do their best to guide you through the UI configuration required
at any such step.


First time set-up (for new Google accounts never before used for development)  

    1)
    init_setup/billing_linked_new_project.sh
        #   This is the first step in setting up a development environment: creates
        #   the new Google Cloud project, with which our runtime code will be associated.


    2)
    ui/scripts/create_sheet_script_context.sh
        # Creates a new Google Sheet and binds the above created Google Apps Script (GAS)
        # project to it, and creates a new tmp staging folder from which transpiled, gas-ified  
        # Javascript code can  be pushed to the GAS cloud environment to be run/tested.


Important Details

    $PROJECT_ROOT/maps_config.env, 

    We try to avoid maintaining script parameters which -- for any 
    given script step -- take in the  outputs of a precursor step (e.g., for step 1 we create 
    a project, whose id is then required in step 2). Rather than cluttering things up by 
    chaining parameters through the sequence of script calls  our development pipeline makes,
    we build up a record of these parameters in $PROJECT_ROOT/maps_config.env. 
    This is a file that each downstream script can check to get the 
    value of any parameter it expects an upstream step to generate.  This file would 
    contain, for example,  the entry:
        PROJECT_ID=<some project id>, created in step 1, and consumed in step 2. 




    


USER NOTES:

If you don't have a gmail.com account, then you can create a google account that will allow you to view spreadsheet via:

    https://accounts.google.com/signupwithoutgmail


Initial project set-up assumes you have installed required dependencies (frameworks, etc).

Current development flow assumes you are on Nixos-based Linux (but we could provide support for other
platforms in our scripted set-up at some point.)


for nixos, init dev env via:

    nix-shell    # this inits dependecies for your current shell seesion per shell.nix




*****
stuff to include later..

https://myaccount.google.com/deleteaccount

payment profile:
    org
        multi user
    individual
        one user

    ignore first project (autocreated).

setup test account  (requires manual interaction to sign up and establish credit card billing)

    https://accounts.google.com/signup



next
    https://console.cloud.google.com/billing

        Create a payments profile
        Add payment method

enable maps API manually..

https://console.cloud.google.com/apis/library/maps-backend.googleapis.com?project=distancetools--1751154563


What Can Be Scripted After Manual Billing Setup
Once the billing account exists, scripting becomes easy and safe. You can:

✅ Script These:
Task	Scriptable?	Notes
Create GCP project	✅	gcloud projects create
Link billing	✅	gcloud beta billing projects link
Enable APIs	✅	gcloud services enable ...
Push clasp scripts	✅	clasp push, etc.
Set budget alerts	✅	gcloud beta billing budgets create






OLD instructions:
Setting up distance tools on new google account (e.g., a test account for dev purposes / script enhancement)

1.  manually create test google account
2.  link to billing acct
    export TEST_ACCOUNT_EMAIL={email of your new test account}
    bash link_to_main_acct_billing.sh  $GOOGLE_ACCT $TEST_ACCOUNT_EMAIL
(master) /home/chris/grassroots_campaign_tools  > 



npm install -g @google/clasp@2.4.1
might need to do this because the latest versions (e.g. 2.4.2 and newer) introduced a breaking change in how .clasp.json and .clasprc.json were handled, especially around:

    Broken or noisy clasp run behavior:

    clasp run began prompting for scopes or failing outright even when scopes were correct.

    Some of these issues appeared around v2.4.2+ due to changes in how runtime credentials and scopes are checked.

    Weird merge of Code.js vs Code.gs behavior:

    A regression where files downloaded as .gs (server default), but clasp confused them with .js locally, especially when both existed.





