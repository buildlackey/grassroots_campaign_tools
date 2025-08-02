# Modified: inject_settings_dialog.sh to inject FormValidation.js before SettingsDialogCode.js

#!/usr/bin/env bash
set -euo pipefail

# Set up paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

TEMPLATE="$PROJECT_DIR/ui/src/SettingsDialog.template.html"
INTERMEDIATE_HTML="$PROJECT_DIR/ui/build/gas_safe_staging/_temp_intermediate_settings.html"
OUTPUT="$PROJECT_DIR/ui/build/gas_safe_staging/SettingsDialog.html"
FORM_VALIDATION_JS="$PROJECT_DIR/ui/build/unit_testable_js/FormValidation.js"
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

if [[ ! -f "$FORM_VALIDATION_JS" ]]; then
  echo "❌ Compiled FormValidation.js not found: $FORM_VALIDATION_JS"
  exit 1
fi

echo "🔧 Injecting FormValidation and settings dialog JS into $OUTPUT..."

# Inject FormValidation.js first
sed "/<!-- INJECT FormValidation.js -->/{
  r $FORM_VALIDATION_JS
  d
}" "$TEMPLATE" > "$INTERMEDIATE_HTML"

# Then inject SettingsDialogCode.js into the intermediate output
sed "/<!-- INJECT SettingsDialogCode.js -->/{
  r $TSC_OUTPUT_JS
  d
}" "$INTERMEDIATE_HTML" > "$OUTPUT"

rm "$INTERMEDIATE_HTML"
echo "✅ Generated $OUTPUT"

