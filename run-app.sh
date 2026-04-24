#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
APP_BUNDLE="$($SCRIPT_DIR/build-app.sh)"
open "$APP_BUNDLE"
