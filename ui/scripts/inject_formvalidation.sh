
#!/usr/bin/env bash
set -euo pipefail

SRC_JS="build/injectable_js/FormValidation.global.js"
OUT_HTML="FormValidationGlobal.html"

echo "(() => {" > "$OUT_HTML"
cat "$SRC_JS" >> "$OUT_HTML"
echo "})();" >> "$OUT_HTML"

echo "✅ Wrapped $SRC_JS → $OUT_HTML"
