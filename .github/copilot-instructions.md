# Copilot Instructions

These instructions guide GitHub Copilot to generate 
code consistent with this project’s architecture, build system, and testing strategy.

---

## 📌 Project Overview

- **Language stack:**
  - Google Apps Script (GAS, transpiled from TypeScript)
  - TypeScript `.ts` logic in `code/gas/src/logic/`
  - Shared contracts in `code/common/src/` (`.d.ts`)
  - UI (HTML, CSS, JS) in `code/ui/src/raw/`
  - Jest tests in `code/ui/test/raw/`
  - Scripts to orchesrtate build tasks (like push to workspace) currently in bash/shell script.

- **Build outputs:**
  - GAS bundle → `dist/gas/gas_safe_staging`
  - Common `.d.ts` → `dist/common/gas_safe_staging`
  - UI raw assets → `dist/ui/gas_safe_staging`

- **Deployment:**
  - Bundled with Webpack + `demodulify_for_gas.js` → ensures GAS runtime compatibility
  - Pushed to Google Sheets-bound Apps Script projects with `clasp` (`push_to_workspace.sh`)
  - Real Maps API key injected into `Code.js` at push time

---

## ⚙️ Coding Guidelines


### Common should be contract only

No implementation files


### TypeScript / GAS (`code/gas/src/logic`)

- Always export classes into `globalThis.CAMPAIGN_TOOLS` for GAS runtime access.  
  ```ts
  (globalThis as any).CAMPAIGN_TOOLS = (globalThis as any).CAMPAIGN_TOOLS || {};
  (globalThis as any).CAMPAIGN_TOOLS.MyClass = MyClass;





## Testing 

### Smoke Test

Runs as part of push to workspace script:  remote calls `smokeTest` function via clasp to confirm runtime linkage.
the pushed code actually runs inside the bound Google Apps Script project, with all the expected services, globals, 
and (development) API keys wired up correctly


### Adhoc UI testing 

The create_dialog_test_fixture.sh script outputs monolithic HTML file that can be brought up locally 
in browser for quick ad hoc testing without deploying all the way to GAS environment.



## ✅ Copilot Tips

- When writing new GAS services, copy the pattern from `PreferenceSvc.ts` or `SheetLayout.ts`
- When modifying dialogs, keep frosting and action code separate
- Always assume GAS runtime = no imports, no ES modules, only `globalThis.CAMPAIGN_TOOLS`
- For tests, mock GAS APIs via `setupMock.js` or `testUtils.ts`

## 🚫 Anti-patterns

❌ **Do not use async/await in GAS logic** (Apps Script runtime doesn't support it)  
❌ **Do not introduce external NPM deps in GAS logic**  
❌ **Do not emit ES module syntax in final GAS bundle**  


