#!/usr/bin/env bash
#
# rename-template.sh — rename this template to a new app.
#
# Usage:
#   ./Scripts/rename-template.sh <NewAppName> <new.bundle.id>
#
# Example:
#   ./Scripts/rename-template.sh AcmeNotes com.acme.notes
#
# What it does:
#   1. Substitutes SwiftUITemplate → <NewAppName> across config files,
#      Sources/App/SwiftUITemplateApp.swift, Tests, schemes, Makefile, README.md, AGENTS.md.
#   2. Substitutes com.example.SwiftUITemplate → <new.bundle.id> in the
#      same set of files.
#   3. Renames Sources/App/SwiftUITemplateApp.swift → Sources/App/<NewAppName>App.swift,
#      Tests/SwiftUITemplateTests/ → Tests/<NewAppName>Tests/, and the
#      .xcscheme files. Deletes the stale .xcodeproj (regenerate with `make project`).
#   4. Smoke-tests via `swift build`.
#
# Refuses to run on a dirty git tree.

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <NewAppName> <new.bundle.id>" >&2
  exit 1
fi

NEW_NAME="$1"
NEW_BUNDLE_ID="$2"
OLD_NAME="SwiftUITemplate"
OLD_BUNDLE_ID="com.example.SwiftUITemplate"

# --- Validate -----------------------------------------------------------------

if ! [[ "$NEW_NAME" =~ ^[A-Za-z][A-Za-z0-9_]*$ ]]; then
  echo "error: <NewAppName> must start with a letter and contain only letters, digits, underscore" >&2
  exit 1
fi

if ! [[ "$NEW_BUNDLE_ID" =~ ^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*)+$ ]]; then
  echo "error: <new.bundle.id> must be a reverse-DNS identifier (e.g. com.acme.notes)" >&2
  exit 1
fi

if [[ "$NEW_NAME" == "$OLD_NAME" ]]; then
  echo "error: new name is the same as the template name; nothing to do" >&2
  exit 1
fi

# --- Locate repo root ---------------------------------------------------------

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -f "Package.swift" ]] || [[ ! -f "project.yml" ]]; then
  echo "error: must run from inside the SwiftUITemplate repo" >&2
  exit 1
fi

# --- Require clean git tree ---------------------------------------------------

if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "error: git tree is dirty — commit or stash changes before renaming" >&2
    exit 1
  fi
fi

# --- Substitute strings -------------------------------------------------------

FILES_TO_REWRITE=(
  "Package.swift"
  "project.yml"
  "Sources/EmbeddedInfo.plist"
  "Resources/Info.plist.template"
  "Makefile"
  "README.md"
  "AGENTS.md"
  "Sources/App/${OLD_NAME}App.swift"
  "Tests/${OLD_NAME}Tests/${OLD_NAME}Tests.swift"
)

for f in "${FILES_TO_REWRITE[@]}"; do
  if [[ -f "$f" ]]; then
    sed -i '' "s|${OLD_BUNDLE_ID}|${NEW_BUNDLE_ID}|g" "$f"
    sed -i '' "s|${OLD_NAME}|${NEW_NAME}|g" "$f"
  fi
done

# Schemes (if .xcodeproj exists — generated, so usually safe to rewrite)
if [[ -d "${OLD_NAME}.xcodeproj/xcshareddata/xcschemes" ]]; then
  for scheme in "${OLD_NAME}.xcodeproj/xcshareddata/xcschemes/"*.xcscheme; do
    [[ -f "$scheme" ]] || continue
    sed -i '' "s|${OLD_BUNDLE_ID}|${NEW_BUNDLE_ID}|g" "$scheme"
    sed -i '' "s|${OLD_NAME}|${NEW_NAME}|g" "$scheme"
  done
fi

# --- Rename files & directories ----------------------------------------------

if [[ -f "Sources/App/${OLD_NAME}App.swift" ]]; then
  mv "Sources/App/${OLD_NAME}App.swift" "Sources/App/${NEW_NAME}App.swift"
fi

if [[ -d "Tests/${OLD_NAME}Tests" ]]; then
  mv "Tests/${OLD_NAME}Tests" "Tests/${NEW_NAME}Tests"
  if [[ -f "Tests/${NEW_NAME}Tests/${OLD_NAME}Tests.swift" ]]; then
    mv "Tests/${NEW_NAME}Tests/${OLD_NAME}Tests.swift" "Tests/${NEW_NAME}Tests/${NEW_NAME}Tests.swift"
  fi
fi

# Rename scheme files and parent .xcodeproj dir.
if [[ -d "${OLD_NAME}.xcodeproj" ]]; then
  for scheme in "${OLD_NAME}.xcodeproj/xcshareddata/xcschemes/${OLD_NAME}.xcscheme"; do
    [[ -f "$scheme" ]] || continue
    mv "$scheme" "${OLD_NAME}.xcodeproj/xcshareddata/xcschemes/${NEW_NAME}.xcscheme"
  done
  # The generated .xcodeproj is gitignored and regenerable; remove and let
  # `make project` recreate it under the new name.
  rm -rf "${OLD_NAME}.xcodeproj"
fi

# --- Smoke test ---------------------------------------------------------------

echo ""
echo "Renamed ${OLD_NAME} → ${NEW_NAME}"
echo "Renamed ${OLD_BUNDLE_ID} → ${NEW_BUNDLE_ID}"
echo ""
echo "Running swift build smoke test..."
swift build

echo ""
echo "Done. Next steps:"
echo "  1. make project              # regenerate the .xcodeproj under the new name"
echo "  2. swift test                # confirm tests still pass"
echo "  3. Edit Resources/AppIcon.icon/Assets/*.svg to update icon art"
echo "  4. Edit Sources/EmbeddedInfo.plist CFBundleShortVersionString/CFBundleVersion if needed"
echo "  5. git add -A && git commit -m \"Rename template to ${NEW_NAME}\""
