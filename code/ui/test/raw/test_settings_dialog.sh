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

# 🔹 compiled common model
COMMON_MODEL_JS="$PROJECT_ROOT/dist/common/gas_safe_staging/CampaignToolsModel.js"

OUT_HTML="$BUILT_UI_DIR/rendered_settings_dialog_test.html"
SETUP_MOCK_JS="$PROJECT_ROOT/code/ui/test/raw/setupMock.js"

mkdir -p "$BUILT_UI_DIR"
rm -f "$OUT_HTML"

echo "📄 Reading template: $TEMPLATE"

# Guard: ensure the compiled model exists
if [[ ! -f "$COMMON_MODEL_JS" ]]; then
  echo "❌ Missing compiled model: $COMMON_MODEL_JS"
  echo "   Make sure common is built (e.g., (cd build/common && npm run dist)) before running this script."
  exit 1
fi

# Process template line by line, inlining fragments
while IFS= read -r line; do
  case "$line" in
    *"include('SettingsDialogCSS')"*)
      echo "🔧 Injecting fragment: SettingsDialogCSS"
      cat "$SETTINGS_DIALOG_CSS" >> "$OUT_HTML"
      ;;
    *"include('SettingsDialogUIFrostingCode')"*)
      echo "🔧 Injecting fragment: SettingsDialogUIFrostingCode"
      cat "$SETTINGS_DIALOG_HELP_UI_CODE" >> "$OUT_HTML"
      ;;
    *"include('SettingsDialogActionCode')"*)
      echo "🔧 Injecting fragment: SettingsDialogActionCode"
      cat "$SETTINGS_DIALOG_CODE" >> "$OUT_HTML"
      ;;
    *"include('CampaignToolsModelCode')"*)
      echo "🔧 Injecting compiled common model: $COMMON_MODEL_JS"
      cat "$COMMON_MODEL_JS" >> "$OUT_HTML"
      ;;
    *)
      echo "$line" >> "$OUT_HTML"
      ;;
  esac
done < "$TEMPLATE"


# Inline setupMock.js at the very end for fixture-only manual browser usage
cat >> "$OUT_HTML" <<'EOF'
<script>
  // Attach mock only when running this HTML directly in a browser (not in Jest)
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
