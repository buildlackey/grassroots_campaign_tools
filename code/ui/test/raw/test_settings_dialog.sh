#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

RAW_DIR="$PROJECT_ROOT/code/ui/src/raw"
TEMPLATE="$RAW_DIR/SettingsDialog.html"
BUILT_UI_DIR="$PROJECT_ROOT/dist/ui"

SETTINGS_DIALOG_CODE="$RAW_DIR/SettingsDialogActionCode.html"
SETTINGS_DIALOG_CSS="$RAW_DIR/SettingsDialogCSS.html"
SETTINGS_DIALOG_HELP_UI_CODE="$RAW_DIR/SettingsDialogUIFrostingCode.html"

OUT_HTML="$BUILT_UI_DIR/rendered_settings_dialog_test.html"
SETUP_MOCK_JS="$PROJECT_ROOT/code/ui/test/raw/setupMock.js"

mkdir -p "$BUILT_UI_DIR"
rm -f "$OUT_HTML"

echo "📄 Reading template: $TEMPLATE"

# Process template line by line
while IFS= read -r line; do
  case "$line" in
    *"include('SettingsDialogCSS')"*)
      cat "$SETTINGS_DIALOG_CSS" >> "$OUT_HTML"
      ;;
    *"include('SettingsDialogUIFrostingCode')"*)
      cat "$SETTINGS_DIALOG_HELP_UI_CODE" >> "$OUT_HTML"
      ;;
    *"include('SettingsDialogActionCode')"*)
      cat "$SETTINGS_DIALOG_CODE" >> "$OUT_HTML"
      ;;
    *)
      echo "$line" >> "$OUT_HTML"
      ;;
  esac
done < "$TEMPLATE"

# Inline setupMock.js at the very end for fixture only
cat >> "$OUT_HTML" <<'EOF'
<script>
/* Jest disables this with __IN_JEST__ flag. */
if (typeof window !== "undefined" && !window.__IN_JEST__) {
EOF
cat "$SETUP_MOCK_JS" >> "$OUT_HTML"
cat >> "$OUT_HTML" <<'EOF'
  if (typeof window.setupMock === "function") {
    window.setupMock(window);
  }
}
</script>
EOF

echo "✅ Rendered HTML saved to: $OUT_HTML"
