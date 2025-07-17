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
  npm install --save-dev jest
else
  echo "✅ jest already listed in devDependencies"
fi

echo "🎉 Bootstrap complete."

