# SwiftUITemplate — minimal macOS SwiftUI app template.
#
# Xcode is the primary build path now. project.yml is the XcodeGen
# source of truth for SwiftUITemplate.xcodeproj. The .xcodeproj is
# gitignored — every dev regenerates locally via `make project`. Run
# that after editing project.yml or adding/removing files under
# Sources/, Resources/, or Tests/.
#
# Tests can be run from CLI two ways. Same test source files, two build
# systems — keep both green:
#   * `make test`   → xcodebuild test  (mirrors the Xcode Tests scheme)
#   * `swift test`  → Package.swift / SPM   (unchanged)
#
# The legacy distribution-style packaging in Scripts/build-app.sh and
# Scripts/run-app.sh is still present for env-var-configurable bundle
# rebuilds (APP_NAME, BUNDLE_IDENTIFIER, VERSION, etc.). Call those
# directly when you need that path; the Makefile no longer routes
# through them.
#
# Targets:
#   make              alias for run-debug
#   make run-debug    build Debug + launch
#   make run-release  build Release + launch
#   make build-debug  build Debug, don't launch
#   make build-release  build Release, don't launch
#   make test         run all test bundles via xcodebuild
#   make project      regenerate SwiftUITemplate.xcodeproj from project.yml
#   make clean        remove build/ and any stale SwiftUITemplate.app
#
# Legacy aliases (kept for muscle memory; route through xcodebuild now,
# not Scripts/build-app.sh):
#   make build        alias for build-debug
#   make run          alias for run-debug

APP_NAME    = SwiftUITemplate
PROJECT     = $(APP_NAME).xcodeproj
SCHEME_APP  = $(APP_NAME)
SCHEME_TEST = Tests
BUILD_DIR   = build
DEBUG_APP   = $(BUILD_DIR)/Build/Products/Debug/$(APP_NAME).app
RELEASE_APP = $(BUILD_DIR)/Build/Products/Release/$(APP_NAME).app

# Pin xcodebuild to a local DerivedData path so the .app lives at a
# predictable location for `open`. Doesn't interfere with Xcode.app's
# normal ~/Library/Developer/Xcode/DerivedData usage.
XCODEBUILD = xcodebuild -project $(PROJECT) -derivedDataPath $(BUILD_DIR)

.PHONY: all
all: run-debug

# --- Build (no launch) ----------------------------------------------------

.PHONY: build-debug
build-debug: $(PROJECT)
	$(XCODEBUILD) -scheme $(SCHEME_APP) -configuration Debug build

.PHONY: build-release
build-release: $(PROJECT)
	$(XCODEBUILD) -scheme $(SCHEME_APP) -configuration Release build

# --- Run (build + launch) -------------------------------------------------
#
# `open` alone won't replace a running instance — it just foregrounds
# the existing process, so you keep seeing the previous build. Kill any
# running copy first, then relaunch. The leading `-` and trailing
# `|| true` swallow the "no matching processes" error on the first
# build of a session.

.PHONY: run-debug
run-debug: build-debug
	-killall $(APP_NAME) 2>/dev/null || true
	@sleep 0.3
	open $(DEBUG_APP)

.PHONY: run-release
run-release: build-release
	-killall $(APP_NAME) 2>/dev/null || true
	@sleep 0.3
	open $(RELEASE_APP)

# Legacy aliases (kept for the original template's documented commands).
.PHONY: build run
build: build-debug
run: run-debug

# --- Tests ----------------------------------------------------------------

.PHONY: test
test: $(PROJECT)
	$(XCODEBUILD) -scheme $(SCHEME_TEST) -configuration Debug test

# --- Project generation ---------------------------------------------------
#
# Regenerates SwiftUITemplate.xcodeproj from project.yml. The project
# file is gitignored; every dev regenerates locally. Prereq:
#   brew install xcodegen
#
# `make project` always force-runs xcodegen. That's deliberate:
# XcodeGen reads the filesystem to discover sources, so a regen is also
# needed after adding/removing .swift files even if project.yml itself
# is untouched. A mtime-based skip would silently miss that case.
#
# The $(PROJECT) rule below is the lazy path for normal builds — if
# SwiftUITemplate.xcodeproj doesn't exist yet (fresh clone) or
# project.yml is newer, builds trigger a regen through `make project`.
# Once the .xcodeproj exists, builds don't gratuitously regen.

.PHONY: project
project:
	@command -v xcodegen >/dev/null 2>&1 || { \
		echo "xcodegen not found. Install with: brew install xcodegen"; \
		exit 1; \
	}
	xcodegen generate

$(PROJECT): project.yml
	@$(MAKE) project

# --- Clean ----------------------------------------------------------------

.PHONY: clean
clean:
	rm -rf $(BUILD_DIR)
	rm -rf $(APP_NAME).app
