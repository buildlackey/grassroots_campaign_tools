#!/usr/bin/env bash
set -euo pipefail

# This script runs Playwright E2E tests using a custom npm launcher if specified.
# Usage: source your env file before running, or ensure PLAYWRIGHT_NPM_LAUNCHER is set in the environment.



# === Standard Preamble  ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
COMMON_SCRIPTS_DIR=$GIT_ROOT/build/scripts/common
E2E_TESTS_SCRIPTS_DIR=$GIT_ROOT/build/scripts/e2e_tests


.  "$COMMON_SCRIPTS_DIR/utils.sh"

# Default to 'npm' if PLAYWRIGHT_NPM_LAUNCHER is not set
LAUNCHER="${PLAYWRIGHT_NPM_LAUNCHER:-npm}"

# Run the E2E tests
echo "🧪 Running Playwright E2E tests..."
cd $SCRIPT_DIR
$LAUNCHER run test:e2e
status=$?
if [ $status -eq 0 ]; then
  echo "success: system tests passed"
else
  echo "system tests failed"
fi
exit $status
