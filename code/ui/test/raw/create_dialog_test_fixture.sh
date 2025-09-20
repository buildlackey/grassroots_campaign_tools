#!/usr/bin/env bash
set -euo pipefail

# Rationale: dist/ui/gas_safe_staging/ (DIST_DIR) is currently the "collection point" for all UI and shared JS artifacts
# that need to be renamed to .html for GAS compatibility. This is practical because:
#   - All UI code expects to include fragments -- regardless of origin (common, or uiartifacts) -- from this directory.
#   - The normalization/renaming script only needs to operate in one place.
#   - The test fixture and deployment scripts can reliably find all needed fragments here.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
BUILT_UI_DIR="$PROJECT_ROOT/dist/ui"

DIALOG_NAME="$1"   # e.g. SettingsDialog or FilterDialog
RAW_DIR="$PROJECT_ROOT/code/ui/src/raw"
DIST_DIR="$PROJECT_ROOT/dist/ui/gas_safe_staging"
TEMPLATE="$RAW_DIR/${DIALOG_NAME}.html"
CSS="$RAW_DIR/${DIALOG_NAME}CSS.html"
ACTION="$RAW_DIR/${DIALOG_NAME}ActionCode.html"
FROSTING="$RAW_DIR/${DIALOG_NAME}UIFrostingCode.html"
FOO="$DIST_DIR/FooCode.html"

# Helper: cat fragment from raw, else fallback to dist
cat_fragment() {
  local raw_path="$1"
  local dist_path="$2"
  if [ -f "$raw_path" ]; then
    cat "$raw_path"
  elif [ -f "$dist_path" ]; then
    cat "$dist_path"
  else
    echo "❌ ERROR: Fragment not found: $raw_path or $dist_path" >&2
    exit 1
  fi
}

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
      cat_fragment "$CSS" "$DIST_DIR/${DIALOG_NAME}CSS.html" >> "$OUT_HTML"
      ;;
    *"include('${DIALOG_NAME}UIFrostingCode')"*)
      cat_fragment "$FROSTING" "$DIST_DIR/${DIALOG_NAME}UIFrostingCode.html" >> "$OUT_HTML"
      ;;
    *"include('${DIALOG_NAME}ActionCode')"*)
      cat_fragment "$ACTION" "$DIST_DIR/${DIALOG_NAME}ActionCode.html" >> "$OUT_HTML"
      ;;
    *"include('FooCode')"*)
      cat_fragment "$RAW_DIR/FooCode.html" "$FOO" >> "$OUT_HTML"
      ;;
    *"include('CampaignToolsLogger')"*)
      cat_fragment "$RAW_DIR/CampaignToolsLogger.html" "$DIST_DIR/CampaignToolsLogger.html" >> "$OUT_HTML"
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
