# === Standard Preamble  ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
COMMON_SCRIPTS_DIR=$GIT_ROOT/build/scripts/common


TARGET=$1           ##  make this less brittle if arg not specified : TODO


.  "$COMMON_SCRIPTS_DIR/utils.sh"


echo       "Note - if we pass in 'module' gas|ui we could probably make this work for either"
#
#


# TODO: change this to dist_dir
BUILD_DIR="$GIT_ROOT/built/$TARGET/gas_safe_staging"   # webpack/inject output

# Blind-copy raw fragments 
RAW_DIR="$GIT_ROOT/code/$TARGET/src/raw"



# 0) Copy built GAS artifacts 
[[ -d "$BUILD_DIR" ]] || { echo "❌ Built UI output not found: $BUILD_DIR"; exit 1; }
echo "📦 Copying built UI artifacts from: $BUILD_DIR"
cp -a "$BUILD_DIR"/. "$WORKING_PUSH_FOLDER"/

# 1) Blind copy ALL raw UI assets (contents only)           
[[ -d "$RAW_DIR" ]] || { echo "❌ RAW_DIR not found: $RAW_DIR"; exit 1; }
echo "📄 Copying raw UI assets from: $RAW_DIR"
cp -a "$RAW_DIR"/. "$WORKING_PUSH_FOLDER"/



