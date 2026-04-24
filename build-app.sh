#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

APP_NAME="${APP_NAME:-SwiftUITemplate}"
BUNDLE_IDENTIFIER="${BUNDLE_IDENTIFIER:-com.example.SwiftUITemplate}"
CONFIGURATION="${CONFIGURATION:-Debug}"
MIN_SYSTEM_VERSION="${MIN_SYSTEM_VERSION:-15.0}"
VERSION="${VERSION:-1.0}"
BUILD="${BUILD:-1}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-$PROJECT_ROOT/build/xcode}"
OUTPUT_DIR="${OUTPUT_DIR:-$PROJECT_ROOT/build/app}"
APP_BUNDLE="$OUTPUT_DIR/$APP_NAME.app"
EXECUTABLE_PATH=""

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "error: xcodebuild not found. Install Xcode and run this script on macOS." >&2
  exit 1
fi

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

xcodebuild \
  -scheme "$APP_NAME" \
  -configuration "$CONFIGURATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -destination 'platform=macOS' \
  build >/tmp/${APP_NAME}-xcodebuild.log

EXECUTABLE_PATH="$(find "$DERIVED_DATA_PATH/Build/Products/$CONFIGURATION" -maxdepth 1 -type f -perm -111 -name "$APP_NAME" | head -n 1)"

if [[ -z "$EXECUTABLE_PATH" ]]; then
  echo "error: built executable not found. Check /tmp/${APP_NAME}-xcodebuild.log" >&2
  exit 1
fi

mkdir -p "$APP_BUNDLE/Contents/MacOS" "$APP_BUNDLE/Contents/Resources"
cp "$EXECUTABLE_PATH" "$APP_BUNDLE/Contents/MacOS/$APP_NAME"
chmod +x "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

tmp_plist="$OUTPUT_DIR/Info.plist"
sed \
  -e "s#__APP_NAME__#$APP_NAME#g" \
  -e "s#__BUNDLE_IDENTIFIER__#$BUNDLE_IDENTIFIER#g" \
  -e "s#__VERSION__#$VERSION#g" \
  -e "s#__BUILD__#$BUILD#g" \
  -e "s#__MIN_SYSTEM_VERSION__#$MIN_SYSTEM_VERSION#g" \
  "$PROJECT_ROOT/Resources/Info.plist.template" > "$tmp_plist"

plutil -lint "$tmp_plist" >/dev/null
cp "$tmp_plist" "$APP_BUNDLE/Contents/Info.plist"
printf 'APPL????' > "$APP_BUNDLE/Contents/PkgInfo"

if command -v codesign >/dev/null 2>&1; then
  codesign --force --sign - "$APP_BUNDLE" >/dev/null
fi

echo "$APP_BUNDLE"
