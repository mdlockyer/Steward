#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
APP_BUNDLE="$($SCRIPT_DIR/build-app.sh 2>/dev/null | tail -1)"
open "$APP_BUNDLE"
