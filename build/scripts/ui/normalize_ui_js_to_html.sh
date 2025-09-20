#!/bin/bash
# -----------------------------------------------------------------------------
# normalize_ui_js_to_html.sh
#
# This script normalizes JavaScript files in the GAS-safe staging directory by
# converting them to HTML files with specific naming conventions. It also
# validates that certain files are not wrapped in an IIFE (Immediately Invoked
# Function Expression).
#
#
# Why check for IIFE?
# -------------------
# - Some build tools or bundlers (like Webpack) may output code wrapped in an IIFE
#   to avoid polluting the global scope.
# - Google Apps Script (GAS) requires all exported classes and functions to be
#   attached to globalThis.CAMPAIGN (see .github/copilot-instructions.md),
#   not hidden inside an IIFE.
# - If your code is wrapped in an IIFE, it will not be accessible in the GAS runtime,
#   and your dialogs/services will break.
#
# Why you should NOT use IIFE for GAS:
# ------------------------------------
# - GAS does not support ES modules or imports/exports.
# - All logic must be attached to the global object (globalThis.CAMPAIGN).
# - Wrapping code in an IIFE hides your classes/functions from the global scope,
#   making them inaccessible to GAS includes and runtime.
# -----------------------------------------------------------------------------

set -e

# Copy all .js files from dist/common/gas_safe_staging/ to dist/ui/gas_safe_staging/
# Rationale: dist/ui/gas_safe_staging/ is the "collection point" for all UI and shared JS artifacts
# that need to be renamed to .html for GAS compatibility. This is practical because:
# - All UI code expects to include fragments from this directory.
# - The normalization/renaming script only needs to operate in one place.
# - The test fixture and deployment scripts can reliably find all needed fragments here.
for f in ../../dist/common/gas_safe_staging/*.js; do
  [ -e "$f" ] || continue
  cp "$f" ../../dist/ui/gas_safe_staging/
  echo "Copied shared JS artifact: $f -> ../../dist/ui/gas_safe_staging/"
done

for f in ../../dist/ui/gas_safe_staging/*.js; do
  base=$(basename "$f" .js)
  # Convert first character to uppercase (InitCap CamelCase)
  camel=$(echo "$base" | sed -E 's/^([a-z])/\U\1/')
  camel=$(echo "$camel" | sed 's/[()]//g')
  out="../../dist/ui/gas_safe_staging/${camel}.html"
  cat "$f" > "$out"
  rm "$f"
  echo "Renamed $f -> $out"
done

# Final cleanup: ensure no stray .js files remain in dist/ui/gas_safe_staging/
find ../../dist/ui/gas_safe_staging/ -maxdepth 1 -name '*.js' -exec rm -f {} +

# Validate all *Code.html files are raw JS (not wrapped in IIFE)
for f in ../../dist/ui/gas_safe_staging/*Code.html; do
  [ -e "$f" ] || continue  # skip if no match
  first_line=$(head -1 "$f" | tr -d '[:space:]')
  if [[ "$first_line" == "(function(global){" ]]; then
    echo "❌ ERROR: $f is incorrectly wrapped in an IIFE!"
    exit 1
  fi
done

