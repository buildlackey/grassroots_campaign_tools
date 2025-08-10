#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

RAW_DIR="$PROJECT_ROOT/code/ui/src/raw"
TEMPLATE="$RAW_DIR/SettingsDialog.html"
BUILT_UI_DIR="$PROJECT_ROOT/built/ui"

COMPILED_FORM_VALIDATION="$BUILT_UI_DIR/unit_testable_js/FormValidation.js"
SETTINGS_DIALOG_CODE="$RAW_DIR/SettingsDialogCode.html"
OUT_HTML="$BUILT_UI_DIR/rendered_settings_dialog_test.html"

echo "📄 Reading template: $TEMPLATE"
rm -f "$OUT_HTML"

# Write static HTML wrapper head
cat > "$OUT_HTML" <<EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Settings Dialog Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
    }
    .help-popup {
      z-index: 9999;
    }
  </style>
</head>
<body>
<h2>🧪 Settings Dialog Local Test</h2>
<script>
EOF


# Close the mock script tag
cat >> "$OUT_HTML" <<EOF
</script>
<div id="settings-dialog-container">
EOF

# Main inject loop
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
  if echo "$line" | grep -q "<?!= include("; then
    fragment=$(echo "$line" | awk -F"'" '{print $2}')
    inject_fragment "$fragment"
  else
    echo "$line" >> "$OUT_HTML"
  fi
done < "$TEMPLATE"

# Close HTML structure
cat >> "$OUT_HTML" <<EOF
</div>
</body>
</html>
EOF

echo "✅ Rendered HTML saved to: $OUT_HTML"

if command -v xdg-open >/dev/null; then
  xdg-open "$OUT_HTML"
else
  echo "🌐 Please open $OUT_HTML manually in your browser."
fi
