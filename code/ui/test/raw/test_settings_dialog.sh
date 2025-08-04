#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

RAW_DIR="$PROJECT_ROOT/code/ui/src/raw"
TEMPLATE="$RAW_DIR/SettingsDialog.html"
COMPILED_FORM_VALIDATION="$PROJECT_ROOT/built/ui/unit_testable_js/FormValidation.js"
SETTINGS_DIALOG_CODE="$RAW_DIR/SettingsDialogCode.html"
OUT_HTML="/tmp/rendered_settings_dialog_test.html"

echo "📄 Reading template: $TEMPLATE"
rm -f "$OUT_HTML"

function inject_fragment() {
  local name="$1"
  echo "🔧 Injecting fragment: $name"

  case "$name" in
    FormValidation)
      cat "$COMPILED_FORM_VALIDATION" >> "$OUT_HTML"
      ;;
    SettingsDialogCode)
      cat "$SETTINGS_DIALOG_CODE" >> "$OUT_HTML"
      ;;
    *)
      echo "❌ Unknown include fragment: $name" >&2
      exit 1
      ;;
  esac
}

while IFS= read -r line; do
  echo processing: $line
  if echo "$line" | grep -q "<?!= include("; then
    echo is match: $line
    # extract fragment name between single quotes
    fragment=$(echo "$line" | awk -F"'" '{print $2}')
    inject_fragment "$fragment"
  else
    echo not match: $line
    echo "$line" >> "$OUT_HTML"
  fi
done < "$TEMPLATE"

echo "✅ Rendered HTML saved to: $OUT_HTML"

if command -v xdg-open >/dev/null; then
  xdg-open "$OUT_HTML"
else
  echo "🌐 Please open $OUT_HTML manually in your browser."
fi

