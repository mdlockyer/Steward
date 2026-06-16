# Archived: AGENTS.md "Native ↔ web bridge" section

Excised from `AGENTS.md` on 2026-06-14 because it describes the **pre-hollow-shell**
architecture: a native sidebar that pushes routes into the page, `loremIpsum` /
`dolorSit` screen ids, and a TypeScript `Web/src/App.tsx`. The hollow-shell redesign
removed the native sidebar (the web app owns all routing), the web app is plain JSX,
and the screen ids changed. For the current bridge contract see `CLAUDE.md` →
"Native ↔ web bridge".

---

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
