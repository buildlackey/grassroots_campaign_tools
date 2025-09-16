#!/bin/bash
set -e

for f in ../../dist/ui/gas_safe_staging/*.js; do
  base=$(basename "$f" .js)
  # Convert first character to uppercase (InitCap CamelCase)
  camel=$(echo "$base" | sed -E 's/^([a-z])/\U\1/')
  camel=$(echo "$camel" | sed 's/[()]//g')
  out="../../dist/ui/gas_safe_staging/${camel}.html"
  if [[ "$out" == *Code.html ]]; then
    echo "outputting raw JS for $out"
    cat "$f" > "$out"
  else
    echo "NOT wrapping OUT> $out"
    cat "$f" > "$out"
  fi
  rm "$f"
done

# Validate all *Code.html files are raw JS (not wrapped in IIFE)
for f in ../../dist/ui/gas_safe_staging/*Code.html; do
  [ -e "$f" ] || continue  # skip if no match
  first_line=$(head -1 "$f" | tr -d '[:space:]')
  if [[ "$first_line" == "(function(global){" ]]; then
    echo "❌ ERROR: $f is incorrectly wrapped in an IIFE!"
    exit 1
  fi
done
