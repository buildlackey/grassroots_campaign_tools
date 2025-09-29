# Playwright Google Login State Recording

This document explains how to record a Google login session for Playwright E2E tests in this project, 
including standard usage and NixOS-specific workarounds.

---

## Standard Usage (Most Developers)

To record a Google login session for Playwright E2E tests, run the following command from
the `<PROJECT_ROOT>/build/scripts/e2e_tests` directory:

```sh
npm run record-login
```

- This uses the local `ts-node` and `node` binaries as configured in `build/scripts/e2e_tests/package.json`:
  ```json
  "record-login": "NODE_OPTIONS='--loader ts-node/esm' node ./record_google_login_state.ts"
  ```
- You will be prompted for Google credentials in a browser window. The login state will be saved for E2E tests.

---

## NixOS or Environments with Missing Binaries

On NixOS or systems where `node_modules/.bin` is not in the PATH or binaries are missing, use the custom wrapper:

```sh
/opt/playwright-npm/bin/playwright-env run record-login
```

- The `playwright-env` wrapper ensures all required Node and Playwright binaries are available in the environment.
- This is necessary because NixOS may not link `node_modules/.bin` as expected, and global npm binaries may not be available.
- The `playwright-env` wrapper is a bubblewrapped environment with all the .so libraries needed to run chrome on nixos installed and available.
- If you don't use nixos, you can ignore this section.

---

## Script Internals

- The main script is `build/scripts/e2e_tests/record_google_login_state.ts`.
- The npm script sets the loader for TypeScript ESM support and runs the recorder script.
- The login state is saved for use in subsequent Playwright E2E tests.

---

## Troubleshooting

- If you see errors about missing `ts-node` or Playwright binaries, ensure you have run `npm install` in `build/scripts/e2e_tests/`.
- On NixOS, always use the `playwright-env` wrapper to guarantee the correct environment.

---

## Summary Table

| Environment         | Command to Run                                             |
|---------------------|-----------------------------------------------------------|
| Standard (most devs)| `npm run record-login`                                    |
| NixOS/custom        | `/opt/playwright-npm/bin/playwright-env run record-login` |

---

For more details, see the scripts in `build/scripts/e2e_tests/` and the npm configuration in `package.json`.
