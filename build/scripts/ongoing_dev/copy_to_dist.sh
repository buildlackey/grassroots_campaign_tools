#!/usr/bin/env bash
set -euo pipefail

# === Parse args ===
TARGET=""
while getopts ":t:" opt; do
  case "$opt" in
    t)
      TARGET="$OPTARG"
      ;;
    \?)
      echo "❌ Invalid option: -$OPTARG" >&2
      echo "Usage: $0 -t <target>"
      echo "       target = ui | gas | all"
      exit 1
      ;;
    :)
      echo "❌ Option -$OPTARG requires an argument." >&2
      echo "Usage: $0 -t <target>"
      exit 1
      ;;
  esac
done

# Require target
if [[ -z "$TARGET" ]]; then
  echo "❌ Missing required -t <target> argument."
  echo "Usage: $0 -t <target>"
  echo "       target = ui | gas | all"
  exit 1
fi

# === Standard Preamble ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
COMMON_SCRIPTS_DIR="$GIT_ROOT/build/scripts/common"

. "$COMMON_SCRIPTS_DIR/utils.sh"

echo "📌 Target selected: $TARGET"

# TODO: change this to dist_dir if needed
BUILD_DIR="$GIT_ROOT/dist/$TARGET/gas_safe_staging"   # webpack/inject output
RAW_DIR="$GIT_ROOT/code/$TARGET/src/raw"               # raw fragments

# 0) Copy dist artifacts
[[ -d "$BUILD_DIR" ]] || { echo "❌ dist output not found: $BUILD_DIR"; exit 1; }
cp -a "$BUILD_DIR"/. "$WORKING_PUSH_FOLDER"/

# 1) Copy raw assets
[[ -d "$RAW_DIR" ]] || { echo "❌ Raw source dir not found: $RAW_DIR"; exit 1; }
echo "📄 Copying raw assets from: $RAW_DIR"
cp -a "$RAW_DIR"/. "$WORKING_PUSH_FOLDER"/

