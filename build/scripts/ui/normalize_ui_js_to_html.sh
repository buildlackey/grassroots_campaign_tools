#!/bin/bash
set -e

for f in ../../dist/ui/gas_safe_staging/*.js; do
  base=$(basename "$f" .js)
  # Convert first character to uppercase (InitCap CamelCase)
  camel=$(echo "$base" | sed -E 's/^([a-z])//')
  mv "$f" "../../dist/ui/gas_safe_staging/${camel}.html"
done

