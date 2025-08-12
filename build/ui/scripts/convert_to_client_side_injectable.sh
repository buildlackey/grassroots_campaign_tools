#!/usr/bin/env bash
set -euo pipefail

# Determine script's directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"


BUILD_OUTPUT_DIR=$GIT_ROOT/built
SRC_DIR=$BUILD_OUTPUT_DIR/ui/unit_testable_js
DEST_DIR=$BUILD_OUTPUT_DIR/ui/gas_safe_staging

mkdir -p "$DEST_DIR"

# Loop through all *_client_side_injectable.js files
for src_file in "$SRC_DIR"/*.js; do
  [ -e "$src_file" ] || continue  # Skip if no matches

  # Extract the base name and derive the JS global name
  filename="$(basename "$src_file")"
  base="${filename%.js}"  
  global_name="$base"

  # Destination HTML file
  dest_file="$DEST_DIR/${base}.html"

  echo "🚀 Converting $filename → $(basename "$dest_file")"

  {
    echo "(() => {"
    cat "$src_file"
    echo ""
    echo "  window.${global_name} = ${global_name};"
    echo "})();"
  } > "$dest_file"
done

echo "✅ All injectable wrappers emitted to $DEST_DIR"

