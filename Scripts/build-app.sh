#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

APP_NAME="${APP_NAME:-SwiftUITemplate}"
BUNDLE_IDENTIFIER="${BUNDLE_IDENTIFIER:-com.example.SwiftUITemplate}"
CONFIGURATION="${CONFIGURATION:-Debug}"
MIN_SYSTEM_VERSION="${MIN_SYSTEM_VERSION:-15.0}"
VERSION="${VERSION:-1.0}"
BUILD="${BUILD:-1}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-$PROJECT_ROOT/Build/xcode}"
OUTPUT_DIR="${OUTPUT_DIR:-$PROJECT_ROOT/Build/app}"
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
  -sdk macosx \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -destination 'generic/platform=macOS' \
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

# ---------------------------------------------------------------------------
# App icons
# ---------------------------------------------------------------------------
# Icon Composer output at Resources/AppIcon.icon carries light/dark/tinted
# variants natively for macOS 26 and compiles to both AppIcon.icns (legacy)
# and Assets.car via actool.
APPICON_BUNDLE="$PROJECT_ROOT/Resources/AppIcon.icon"

# Helper: merge a partial Info.plist (written by actool) into $tmp_plist.
# Strategy: read each top-level key from the partial and -replace it.
merge_partial_plist() {
  local partial="$1"
  [[ -f "$partial" ]] || return 0
  while IFS= read -r key; do
    [[ -z "$key" ]] && continue
    local value_xml
    value_xml="$(plutil -extract "$key" xml1 -o - "$partial" 2>/dev/null || true)"
    if [[ -n "$value_xml" ]]; then
      plutil -replace "$key" -xml "$value_xml" "$tmp_plist" 2>/dev/null || \
        plutil -insert "$key" -xml "$value_xml" "$tmp_plist" 2>/dev/null || true
    fi
  done < <(plutil -convert xml1 -o - "$partial" | \
           grep -E '^\s*<key>' | sed -E 's/^\s*<key>(.*)<\/key>\s*$/\1/')
}

if [[ -d "$APPICON_BUNDLE" ]]; then
  if ! command -v actool >/dev/null 2>&1; then
    echo "error: actool not found. Install Xcode command line tools." >&2
    exit 1
  fi

  partial_plist="$OUTPUT_DIR/AppIconBundle-partial.plist"
  actool \
    --output-format human-readable-text \
    --notices --warnings \
    --app-icon AppIcon \
    --compile "$APP_BUNDLE/Contents/Resources" \
    --platform macosx \
    --minimum-deployment-target "$MIN_SYSTEM_VERSION" \
    --output-partial-info-plist "$partial_plist" \
    "$APPICON_BUNDLE" >/tmp/${APP_NAME}-actool-icon.log
  merge_partial_plist "$partial_plist"
fi

cp "$tmp_plist" "$APP_BUNDLE/Contents/Info.plist"
printf 'APPL????' > "$APP_BUNDLE/Contents/PkgInfo"

if command -v codesign >/dev/null 2>&1; then
  codesign --force --sign - "$APP_BUNDLE" >/dev/null
fi

echo "$APP_BUNDLE"
