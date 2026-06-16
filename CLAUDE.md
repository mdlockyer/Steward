# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Steward** is a hybrid macOS app: a native SwiftUI "hollow shell" window whose entire
content area is a single transparent, full-bleed `WKWebView` hosting a React app. There
is no native sidebar, toolbar, or navigation — the web app supplies all of its own chrome,
exactly as it would in a browser. The only native chrome is the transparent titlebar's
traffic lights floating over the top-left, plus a 34px transparent drag strip so the
window stays movable.

> **Naming gotcha:** the Swift package, Xcode target, scheme, and bundle id are all still
> `SwiftUITemplate` / `com.example.SwiftUITemplate` (this began as a template). The shipping
> product is **Steward**. Don't "fix" the target name — build/test commands key on it.

The two halves:
- **Native shell** — `Sources/` (flat layout, *not* `Sources/SwiftUITemplate/`). Swift 6, macOS 26.
- **Web app** — `Web/`, a self-contained Vite + React 18 project (plain **JSX, not TypeScript**)
  with a Node backend that runs as Vite middleware (the real model-calling agent loop).

## Commands (Makefile is the entry point)

| Command | What it does |
|---|---|
| `make web-dev` | Start Vite dev server on `:5173` (hot reload). Leave running. |
| `make run` / `make run-debug` | Build + launch the Debug `.app`, which **loads the dev server**. |
| `make run-release` | Build the web app, bundle it, launch the Release `.app` (loads bundled assets). |
| `make test` | `xcodebuild` the `Tests` scheme (Swift Testing). |
| `make project` | Regenerate `SwiftUITemplate.xcodeproj` from `project.yml` (needs `brew install xcodegen`). |
| `make web` / `make web-install` | Build / `npm install` the `Web/` project. |
| `make clean` | Remove `build/`, stale `.app`, built web assets. |

**Day-to-day dev loop:** `make web-dev` in one terminal, `make run` in another. The Debug app
loads `http://localhost:5173` with hot reload.

**Tests run two ways against the same source files — keep both green:**
- `make test` → xcodebuild (mirrors the Xcode `Tests` scheme)
- `swift test` → SPM via `Package.swift`. One test: `swift test --filter <name>`.
- `swift test` emits an expected "unhandled file" warning for `EmbeddedInfo.plist` (it's
  consumed by linker flags, not as a resource).

**Run `make project` after** editing `project.yml` *or* adding/removing any file under
`Sources/`, `Resources/`, or `Tests/` — XcodeGen reads the filesystem to discover sources.

### Three build inputs (all describe the same app)
- `project.yml` — XcodeGen source of truth → generates the gitignored `.xcodeproj` (the primary path).
- `Package.swift` — drives `swift test` and "open the package in Xcode".
- `Scripts/build-app.sh` / `run-app.sh` — legacy env-var-configurable packaging
  (`APP_NAME`, `BUNDLE_IDENTIFIER`, `VERSION`…). Call directly when you need that path.

## Native ↔ web bridge

`WebContentView` (`Sources/Web/`) wraps the single persistent `WKWebView` and is the entire
window content. The contract:
- **Swift → JS** via `window.__native` (injected at documentStart by `WebBridge.bootstrapScript`):
  `setTheme("light"|"dark")`, plus `navigate(id)` / `setInsets(top, bottom)`.
- **JS → Swift** via `window.webkit.messageHandlers.native.postMessage(...)`:
  `{type:"ready"}` (Swift then flushes the current theme) and `{type:"notify", title, body}`
  (Swift posts a real macOS `UNUserNotification`).
- **RELEASE** serves the bundled web app over `app://local/` (`AppSchemeHandler`, with SPA
  fallback to `index.html`). **DEBUG** loads the Vite dev server.

> **Vestigial native navigation:** `navigate`/`setInsets` and the entire `Screen` enum
> (`Sources/Navigation/Screen.swift`) are leftovers from an earlier design that had a native
> sidebar pushing routes into the page. After the hollow-shell redesign the web app owns all
> routing, and the current `WebContentView` only forwards `colorScheme` — nothing calls
> `navigate`/`setInsets`. `Screen` is dead native code kept only because a test still asserts
> its rawValues. See the test caveat below before relying on this.

## Web app architecture (`Web/`)

Single React root: `src/main.jsx` → `src/Steward.jsx`, which holds all route/screen state
(no router library). Screens are JSX modules (`Desk`, `Carrying`, `Meetings`, `Roadmap`,
`Vault`, `Studio`, `Sources`, `Log`, `Settings`); shared UI in `components.jsx`; hand-rolled
macOS design tokens in `styles.js` (the `CSS` object — **no UI framework**); the mock world in
`data.js`. **All product data is mock/sample.** Product concept: a "loops-and-Moves" tool.

**Backend = Vite middleware** (`Web/server/`, mounted in `vite.config.js`), so the whole demo
is still one `npm run dev`. Endpoints: `/api/chat` (NDJSON streaming), `/api/providers`,
`/api/settings`, `/api/auth/openai/start`, `/api/providers/models`.
- `agent.js` — the **provider-neutral agent loop**. Keeps a neutral transcript; one tool call
  per turn. Read tools (`read_source`, `find_related`, `find_parts`, `await_reply`) execute
  immediately; **write tools (`draft_and_send`, `create_artifact`) PAUSE for explicit user
  approval** (`approval_request` event → next request carries a `resolve`). The reasoning is
  real (a real model drives the loop); the "world" it acts on (`world.js`) is all simulated.
- `providers.js` — provider abstraction selected by `kind`: `anthropic` (Messages API),
  `openai-oauth` (Responses/WHAM), else chat completions (any OpenAI-compatible endpoint).
- `config.js` — provider config = built-ins from env, overlaid with the Settings-managed
  `steward.config.local.json`. **Resolved per request**, so Settings changes apply without a
  server restart.
- `openai-oauth.js` — "Sign in with ChatGPT" OAuth.

**Secrets stay server-side** (in `.env.local` and `steward.config.local.json`, both gitignored)
and are never bundled into the browser. To enable real model calls: copy `Web/.env.example` →
`Web/.env.local` and set `ANTHROPIC_API_KEY` (and/or `OPENAI_API_KEY`).

## Conventions

- **Swift:** Swift 6 strict concurrency (`swiftLanguageModes: [.v6]`), macOS 26 target. 4-space
  indent, `UpperCamelCase` types, `@MainActor` on AppKit-touching types, `@AppStorage` keys via
  `SettingsStorageKey`. No SwiftLint/SwiftFormat — match surrounding style.
- **Web:** plain JSX (React 18), TypeScript is *not* used. Styling is the hand-rolled `CSS`
  tokens in `styles.js` so the web matches native macOS — don't reach for a UI framework.
- **Commits:** short, sentence-case, no conventional-commit prefixes. Commit `project.yml`;
  **never** commit the generated `.xcodeproj`, the built `Resources/web`, or any secret.

## Known caveat: the Swift test suite is out of sync

The committed test `Tests/SwiftUITemplateTests/SwiftUITemplateTests.swift` constructs
`WebContentView(screenID:colorScheme:safeAreaInsets:)` and asserts the old navigation/inset
behavior, but the hollow-shell redesign reduced `WebContentView` to take only `colorScheme`.
As written, **`make test` / `swift test` will fail to compile** until those tests (the
`WebContentViewTests` suite, and the `Screen` rawValue contract test) are updated to match the
current source. Verify/fix the tests before relying on them as a green baseline.

## Related docs

`AGENTS.md` covers the build system well, but its "Native ↔ web bridge" section predates the
hollow-shell redesign (it still describes a native sidebar and `loremIpsum`/`dolorSit` screen
ids / a TypeScript `Web/src/App.tsx`) — trust this file and the source over it for the bridge.
