# Repository Guidelines

## Project Structure & Module Organization

`SwiftUITemplate` is a **hybrid macOS app**: a native SwiftUI shell whose detail
area is a single transparent `WKWebView` hosting a React app. The native sidebar,
glass toolbar, and appearance picker are real; the page content is web.

- **Native shell** (`Sources/`, flat — not `Sources/SwiftUITemplate/`): `App/`
  (entry point + AppDelegate menu/window tweaks), `Navigation/` (`ContentView`
  owns the `NavigationSplitView`; `Screen` is the sidebar registry), `Settings/`,
  `Appearance/`, and `Web/` (the WebView bridge — see below).
- **Web app** (`Web/`): a self-contained Vite + React + TypeScript project. Built
  output goes to `Resources/web/` (gitignored; `.gitkeep` keeps the dir so the
  Xcode folder reference resolves) and is bundled into the `.app`.
- **Three build inputs**: `project.yml` (XcodeGen source of truth → gitignored
  `.xcodeproj`, the primary path), `Package.swift` (drives `swift test`), and
  legacy `Scripts/build-app.sh`. Regenerate the project with `make project` after
  editing `project.yml` or adding/removing Swift files.

### Native ↔ web bridge

`Sources/Web/WebContentView.swift` wraps `WKWebView` and is the detail content —
the sidebar **never swaps it**. Selecting a sidebar item pushes a `navigate` event
into the page; React changes screen internally. The contract:

- **Swift → JS** (`window.__native`, defined by `WebBridge.bootstrapScript`):
  `navigate(id)`, `setTheme("light"|"dark")`, `setInsets(top, bottom)`.
- **JS → Swift**: `postMessage({ type: "ready" })` after React mounts; Swift then
  flushes state.
- **Screen ids are `Screen` rawValues** (`loremIpsum`, `dolorSit`) — matched in
  `Web/src/App.tsx`. A test guards this contract.

`AppSchemeHandler` serves the bundled app over `app://local/` in RELEASE; DEBUG
loads the Vite dev server.

## Build, Test, and Development Commands

- `make web-dev` (one terminal) + `make run` (another) — DEBUG dev loop with web
  hot reload (`localhost:5173`).
- `make run-release` — builds the web app, bundles it, runs the RELEASE `.app`.
- `make web` / `make web-install` — build / install the `Web/` project.
- `make test` (xcodebuild) and `swift test` (SPM) — same Swift tests, two systems;
  keep both green. One SPM test: `swift test --filter <name>`.
- `make project` — regenerate the `.xcodeproj`. `make clean` — remove build output.

## Coding Style & Naming Conventions

Swift 6 language mode + strict concurrency (`swiftLanguageModes: [.v6]`), macOS 26
target; no SwiftLint/SwiftFormat — match 4-space indent, `UpperCamelCase` types,
`@MainActor` on AppKit-touching types, `@AppStorage` keys via `SettingsStorageKey`.
Web is TypeScript `strict`; styling is hand-rolled macOS design tokens in
`Web/src/theme.css` (no UI framework) so the web matches native.

## Testing Guidelines

Swift Testing (`@Suite`/`@Test`) in `Tests/SwiftUITemplateTests/`, with
`@testable import SwiftUITemplate` (so `ENABLE_TESTABILITY` stays on in Debug).
`swift test` emits an expected "unhandled file" warning for `EmbeddedInfo.plist`
(it's consumed by linker flags, not as a resource).

## Commit & Pull Request Guidelines

Commit subjects are short, sentence-case, imperative or descriptive ("Lock base
features") — no conventional-commit prefixes. No PR template. Commit `project.yml`,
never the generated `.xcodeproj` or built `Resources/web`.
