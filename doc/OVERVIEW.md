# Overview

This repository provides an end-to-end, opinionated build framework and utility library
for Google Sheets Add-ons that use Google's paid Web APIs. We also provide a skeletal 
application that you can use as a starting point for your own extensions.


*End-to-end*, means we have extensively (to the extent possible given Google-imposed security restrictions) 
automated, or at least documented both:

- the  [initial account set-up steps](../build/scripts/init_setup/INIT_SETUP.md) required to support add-on development 
  using [Google Apps Script](https://workspace.google.com/products/apps-script/) (GAS), 
  the [cloud CLI](https://cloud.google.com/cli), oauth configuration, and linkage to billing 
-  and [ongoing development](../build/scripts/ongoing_dev/ONGOING_DEVELOPMENT.md), including transcompilation, 
  unit testing, bundling, deployment and integration testing of your application code.


*Opinionated* means that we have made a number of architectural decisions that inform 
the structure of a new project's code, as well as the flow of the 
build and deployment process. We assume your code will be written in Typescript, tested 
with [Jest](https://jestjs.io/) and [Playwright](https://playwright.dev/), and 
integration tested via remote calls using the GAS execution API
(which requires oauth set-up) to simulate end-to-end interaction. 
Once tested, your code is 'GAS-ified' (i.e., adapted to the Google Apps Script runtime environment)
via [webpack](https://webpack.js.org/), and then 
pushed to Google's cloud environment for execution. Build script steps for a given sub-system are defined 
by package.json scripts, and the overall flow is orchestrated by
[this script](../build/scripts/ongoing_dev/push_to_workspace.sh).


The build framework strives to support code quality and debuggability via testing hooks, linting, 
and [source map](https://survivejs.com/books/webpack/building/source-maps/) support.  




# Key Design Patterns Informing Code Organization

Source code is organized into three main areas under `code/`:

- `gas/`
  - backend logic (executing in the Apps Script engionrment)
- `ui/`
  - dialogs,  client-side scripting (HTML/CSS/JS)
- `common/`
  - services required by both gas and ui contexts (e.g., logging)

The ui subsystem's organization is complicated by the fact that an application could
have an arbitrary number of dialogs (note: there's no sidebar support at this time), 
each with its own raw HTML/CSS/JS resources and logic. The Typescript code for any dialog 'Foo' is separated out  into
FooActionCode.ts, and FooUIFrostingCode.ts. The former includes event-handlers, initial rendering
and event handler bindings, and the latter includes more purely UI related behavior, such as tool-tips,
spinners, and UI element style changes (such as blur of sensitive data on loss of focus, etc.)


We organize these as follows

    - ui/
        - src/
            - util
            - XxxDialog 
                - raw
                    - XxxDialog.html
                    - XxxDialogCSS.html
                    - XxxIcon1.html 
                    - XxxIcon2.html
                - logic
                    - XxxDialogActionCode.html
                    - XxxDialogActionUIFrosting.html

            - YyyDialog
                - raw
                - logic
            - [ ZzzDialog .... & potentially other dialogs ]
        - test/


The GAS environment include mechanism requires that for any artifact that an .html markup artifact (XXXDialog.html)
brings  in via include (`<?= include xxx.html>`)  must itself have an '.html' extension. 
So .css files, .svg files for image icons and the like all get this extension. 




# Build Framework 

Each subsystem has its own build process in a parallel directory:

- build/
    - gas/
    - ui/
    - src/
        - common/    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  # contains shared code used by all dialogs
        - XxxDialog 
            - raw
                - XxxDialog.html
                - XxxDialogCSS.html
                - XxxIcon1.html 
                - XxxIcon2.html
              - logic   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  # contains typescript code for this dialog
                - XxxDialogActionCode.html
                - XxxDialogActionUIFrostingCode.html
        - YyyDialog
            - raw       
            - logic
      - [ other dialogs ]
    - test/
    - 
    - XxxDialog
    - YyyDialog


And each produces output into its own staging area:

- dist/
    - gas/gas_safe_staging/
    - ui/gas_safe_staging/
    - common/gas_safe_staging/



## Chaining Output of Build Steps Into Input of Downstream Steps

In order to reduce the number of script input parameters, 
any build step that needs to supply information to a downstream step is expected to write that information 
in the form of a key value pair in the file `$PROJECT_ROOT/maps_config.env`
This file is explicitly not checked into source control, as it may include sensitive information such as API keys, 
as in:

- `GOOGLE_MAPS_API_KEY=xyz123`






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
(master) /home/chris/grassroots_CAMPAIGN  > 



npm install -g @google/clasp@2.4.1
might need to do this because the latest versions (e.g. 2.4.2 and newer) introduced a breaking change in how .clasp.json and .clasprc.json were handled, especially around:

    Broken or noisy clasp run behavior:

    clasp run began prompting for scopes or failing outright even when scopes were correct.

    Some of these issues appeared around v2.4.2+ due to changes in how runtime credentials and scopes are checked.

    Weird merge of Code.js vs Code.gs behavior:

    A regression where files downloaded as .gs (server default), but clasp confused them with .js locally, especially when both existed.





