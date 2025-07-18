#!/usr/bin/env bash
set -euo pipefail

# Resolve project root relative to this script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

TEMPLATE="$PROJECT_DIR/src/FilterUI.template.html"
SIDEBAR_JS="$PROJECT_DIR/src/FilterUICode.js"
OUTPUT="$PROJECT_DIR/build/FilterUI.html"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "❌ Template HTML not found: $TEMPLATE"
  exit 1
fi

if [[ ! -f "$SIDEBAR_JS" ]]; then
  echo "❌ not found: $SIDEBAR_JS"
  exit 1
fi

echo "🔧 Injecting sidebar JS into $OUTPUT..."

# Inject the JS inline at the placeholder comment
sed "/<!-- INJECT FilterUICode.js -->/{
    r $SIDEBAR_JS
    d
}" "$TEMPLATE" > "$OUTPUT"


echo "✅ Generated $OUTPUT"

