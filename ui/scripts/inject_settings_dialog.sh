#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

TEMPLATE="$PROJECT_DIR/ui/src/SettingsDialog.template.html"
OUTPUT="$PROJECT_DIR/ui/build/gas_safe_staging/SettingsDialog.html"
JS_FILE="$PROJECT_DIR/ui/src/SettingsDialogCode.js"

if [[ ! -f "$TEMPLATE" || ! -f "$JS_FILE" ]]; then
  echo "❌ Missing template or JS file"
  exit 1
fi

echo "🔧 Injecting settings dialog JS into $OUTPUT..."

sed "/<!-- INJECT SettingsDialogCode.js -->/{
  r $JS_FILE
  d
}" "$TEMPLATE" > "$OUTPUT"

echo "✅ Generated $OUTPUT"

