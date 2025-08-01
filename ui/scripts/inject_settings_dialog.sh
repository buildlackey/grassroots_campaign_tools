#!/usr/bin/env bash
set -euo pipefail

# Set up paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

TEMPLATE="$PROJECT_DIR/ui/src/SettingsDialog.template.html"
OUTPUT="$PROJECT_DIR/ui/build/gas_safe_staging/SettingsDialog.html"
TSC_OUTPUT_JS="$PROJECT_DIR/ui/build/unit_testable_js/SettingsDialogCode.js"

# ✅ Use compiled JS directly from tsc output (do not copy to staging folder)
if [[ ! -f "$TEMPLATE" ]]; then
  echo "❌ Template not found: $TEMPLATE"
  exit 1
fi

if [[ ! -f "$TSC_OUTPUT_JS" ]]; then
  echo "❌ Compiled SettingsDialogCode.js not found: $TSC_OUTPUT_JS"
  exit 1
fi

echo "🔧 Injecting settings dialog JS into $OUTPUT..."

# Inject directly from tsc output folder into the HTML
sed "/<!-- INJECT SettingsDialogCode.js -->/{
  r $TSC_OUTPUT_JS
  d
}" "$TEMPLATE" > "$OUTPUT"

echo "✅ Generated $OUTPUT"

