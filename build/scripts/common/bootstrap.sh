#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Bootstrapping project environment..."

# Check for global clasp installation
if ! command -v clasp >/dev/null 2>&1; then
  echo "📦 Installing clasp globally..."
  npm install -g clasp
else
  echo "✅ clasp is already installed globally"
fi

# Determine project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

# Only install project dependencies if missing
if [[ ! -d "node_modules" ]]; then
  echo "📦 Installing project dependencies..."
  npm install
else
  echo "✅ node_modules already present"
fi

# Check if Jest is already listed in devDependencies
if ! jq -e '.devDependencies.jest' package.json >/dev/null 2>&1; then
  echo "📦 Adding jest to devDependencies..."
  npm install --save-dev jest ts-jest @types/jest @types/node@18
else
  echo "✅ jest already listed in devDependencies"
fi

# Ensure @types/node is present for webpack type checking
if ! grep -q '"@types/node"' package.json; then
  echo "📦 Adding @types/node to devDependencies..."
  npm install --save-dev @types/node
else
  echo "✅ @types/node already listed in devDependencies"
fi

# Ensure html-webpack-plugin is present for HTML bundling
if ! jq -e '.devDependencies["html-webpack-plugin"]' package.json >/dev/null 2>&1; then
  echo "📦 Adding html-webpack-plugin to devDependencies..."
  npm install --save-dev html-webpack-plugin
else
  echo "✅ html-webpack-plugin already listed in devDependencies"
fi

# Ensure @types/webpack is present for html-webpack-plugin typings
if ! jq -e '.devDependencies["@types/webpack"]' package.json >/dev/null 2>&1; then
  echo "📦 Adding @types/webpack to devDependencies..."
  npm install --save-dev @types/webpack
else
  echo "✅ @types/webpack already listed in devDependencies"
fi

# Ensure glob is present for dynamic entry generation in webpack.config.js
if ! jq -e '.devDependencies["glob"]' package.json >/dev/null 2>&1; then
  echo "📦 Adding glob to devDependencies..."
  npm install --save-dev glob
else
  echo "✅ glob already listed in devDependencies"
fi

# Ensure @types/google-apps-script is present for GAS type support
if ! jq -e '.devDependencies["@types/google-apps-script"]' package.json >/dev/null 2>&1; then
  echo "📦 Adding @types/google-apps-script to devDependencies..."
  npm install --save-dev @types/google-apps-script
else
  echo "✅ @types/google-apps-script already listed in devDependencies"
fi

# Ensure webpack-cli is present for CLI support
if ! jq -e '.devDependencies["webpack-cli"]' package.json >/dev/null 2>&1; then
  echo "📦 Adding webpack-cli to devDependencies..."
  npm install --save-dev webpack-cli
else
  echo "✅ webpack-cli already listed in devDependencies"
fi

# Ensure gas-webpack-plugin is present for Apps Script bundling
if ! jq -e '.devDependencies["gas-webpack-plugin"]' package.json >/dev/null 2>&1; then
  echo "📦 Adding gas-webpack-plugin to devDependencies..."
  npm install --save-dev gas-webpack-plugin
else
  echo "✅ gas-webpack-plugin already listed in devDependencies"
fi



echo "🎉 Bootstrap complete."


