#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
BUILT_UI_DIR="$PROJECT_ROOT/dist/ui"


DIALOG_NAME="$1"   # e.g. SettingsDialog or FilterDialog
RAW_DIR="$PROJECT_ROOT/code/ui/src/raw"
TEMPLATE="$RAW_DIR/${DIALOG_NAME}.html"
CSS="$RAW_DIR/${DIALOG_NAME}CSS.html"
ACTION="$RAW_DIR/${DIALOG_NAME}ActionCode.html"
FROSTING="$RAW_DIR/${DIALOG_NAME}UIFrostingCode.html"








# 🔹 compiled common contracts (NOT GAS bundle)
COMMON_DIR="$PROJECT_ROOT/dist/common/gas_safe_staging"

OUT_HTML="$BUILT_UI_DIR/rendered_settings_dialog_test.html"
SETUP_MOCK_JS="$PROJECT_ROOT/code/ui/test/raw/setupMock.js"

mkdir -p "$BUILT_UI_DIR"
rm -f "$OUT_HTML"

echo "📄 Reading template: $TEMPLATE"


# Process template line by line, inlining fragments
while IFS= read -r line; do
  case "$line" in
    *"include('${DIALOG_NAME}CSS')"*)
      cat "$CSS" >> "$OUT_HTML"
      ;;
    *"include('${DIALOG_NAME}UIFrostingCode')"*)
      cat "$FROSTING" >> "$OUT_HTML"
      ;;
    *"include('${DIALOG_NAME}ActionCode')"*)
      cat "$ACTION" >> "$OUT_HTML"
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
