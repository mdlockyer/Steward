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
# This app is a hybrid: native SwiftUI shell (sidebar + toolbar) with a
# transparent WebView detail area hosting the React app in Web/. DEBUG builds
# load the Vite dev server; RELEASE builds load the bundled web assets.
#
#   For day-to-day dev: run `make web-dev` in one terminal, `make run` in
#   another. The Debug app loads http://localhost:5173 with hot reload.
#
# Targets:
#   make              alias for run-debug
#   make run-debug    build Debug + launch (loads the Vite dev server)
#   make run-release  build Release + launch (bundles + loads the web app)
#   make build-debug  build Debug, don't launch
#   make build-release  build web + Release, don't launch
#   make test         run all test bundles via xcodebuild
#   make project      regenerate SwiftUITemplate.xcodeproj from project.yml
#   make web          build the React app into Resources/web (bundled)
#   make web-dev      start the Vite dev server (hot reload) on :5173
#   make web-install  npm install for the Web/ project
#   make clean        remove build/, stale .app, and built web assets
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

# Web (React/Vite) layer. Source lives in Web/; the build output lands in
# WEB_OUT, which is bundled into the .app (see project.yml folder reference).
WEB_DIR     = Web
WEB_OUT     = Resources/web

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
build-release: web $(PROJECT)
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

# --- Web (React / Vite) ---------------------------------------------------
#
# The detail/content area of the app is a transparent WebView hosting the
# React app in Web/. Two paths:
#   * DEBUG builds load the dev server (run `make web-dev` in another terminal).
#   * RELEASE builds load the bundled assets, so `build-release` runs `web`
#     first to populate WEB_OUT.
# Prereq: Node.js + npm.

.PHONY: web-install
web-install:
	npm --prefix $(WEB_DIR) install

# Build the web app into WEB_OUT (bundled into the .app). Installs deps if
# node_modules is missing so a fresh clone's `make build-release` just works.
.PHONY: web
web:
	@[ -d $(WEB_DIR)/node_modules ] || npm --prefix $(WEB_DIR) install
	npm --prefix $(WEB_DIR) run build

# Live dev server with hot reload, on http://localhost:5173. DEBUG app builds
# load this. Leave it running while you work.
.PHONY: web-dev
web-dev:
	@[ -d $(WEB_DIR)/node_modules ] || npm --prefix $(WEB_DIR) install
	npm --prefix $(WEB_DIR) run dev

# --- Clean ----------------------------------------------------------------

.PHONY: clean
clean:
	rm -rf $(BUILD_DIR)
	rm -rf $(APP_NAME).app
	rm -rf $(WEB_OUT)/assets $(WEB_OUT)/index.html
