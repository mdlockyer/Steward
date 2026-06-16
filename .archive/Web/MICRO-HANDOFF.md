# Steward — Micro Handoff
*2026-06-13*

## TL;DR
Steward is a **hybrid macOS app**: a native SwiftUI shell (`~/Projects/Steward`,
Xcode target `SwiftUITemplate`) wrapping one transparent `WKWebView` that hosts a
React app (`~/Projects/steward-app`). The native sidebar now drives web
navigation. **The next phase is a product reframe, not more screens:** rebuild the
web app from an errand-closer into a *loops-and-Moves* tool (see Target), entirely
on mock data, with premium, zero-jank polish.

## Where it stands (verified this session)
- **Native sidebar owns nav.** `Screen` registry (`Sources/Navigation/Screen.swift`)
  = `desk / studio / sources / log / settings`; each rawValue **is** the web `route` id.
- **Bridge wired both ways.** native→web `window.__native.navigate(id)`; web→native
  `postMessage({type:"ready"})` on mount and `{type:"route", id}` on every route
  change, so the sidebar highlight tracks in-app jumps (Inspector→Studio, etc.).
  Files: `Sources/Web/{WebContentView,WebBridge}.swift`, `steward-app/src/Steward.jsx`
  (search `embedded`, `native:navigate`).
- **Web rail auto-hidden when embedded** (the `embedded` flag); the standalone
  browser build still shows it.
- Verified: clicking Desk/Studio/Sources/Log in the native sidebar switches the web
  page and the toolbar title. DEBUG loads the Vite dev server (steward-app at :5173).

## Open issue — fix before moving on
- **Sidebar overlay/underlap.** The detail WebView uses `.ignoresSafeArea()` (all
  edges, `Sources/Navigation/ContentView.swift`), so web content bleeds *under* the
  translucent sidebar and the leading edge of every page is occluded.
  `.navigationSplitViewStyle(.balanced)` was added but did **not** resolve it.
  Next suspect: `.ignoresSafeArea(edges: [.top, .bottom])` (respect the leading /
  sidebar edge, keep sliding under the top glass toolbar). Rebuild + visual verify.

## Other known gaps
- Native dark-mode toggle doesn't theme the web (steward-app is light-only; the
  bridge sets `data-theme` but the CSS ignores it).
- Settings is duplicated: native ⌘, scene **and** web provider Settings (as a route).
- RELEASE still bundles the old placeholder `Steward/Web/`, not steward-app.

## Target state — definition of done (goal-ready, <4000 chars)
Reframe: a Technical Director's week is *open loops that persist across days*, not
errands. Build around loops; the errand Move becomes one type inside it. The
prototype's Log was a graveyard of finished things — here, what matters is **what
you are carrying**, and the Log is only the part that has closed.

- **Core model.** Everything tracked is an open loop (owner, counterparty, state,
  age). A Move opens a loop (send the ask), advances one (nudge / escalate / gather
  input), or closes one (file / publish). The spine of reasoned nodes, approval
  gates, per-node confidence, and correct-and-recompute carry over **unchanged**.
- **Surfaces.** *Desk* ranks by **severity × needle-impact** (confidence demoted to a
  quality signal; fires surface to the top and, past a threshold, interrupt).
  *Carrying* = the new substrate: every open loop in one place with age + next nudge.
  *Meetings* first-class: prep brief before, commitment fan-out after → Carrying +
  decision log. *Roadmap* treated as living: surface slips / broken deps as loops.
  *Sources* keeps the MCP mesh + swappable engine, gains a people/org model +
  financial data. *Log* narrows to closed loops, full trace preserved.
- **Capabilities.** Delegation + people/org model (route / reassign / escalate to the
  right owner). Reactive mode (urgency, escalation, change-since-last-look,
  out-of-app notifications). Audience-aware gates (a VP message raises the bar vs a
  peer ping). Cross-Move memory (corrections stick — "we standardize on Arctic").
  Move types: errand, delegate, escalate, prep (read-only, no send gate), reconcile,
  pitch (deck + justification, not a ticket).
- **Constraints.** Everything on **mock data**. **Premium, zero-jank UI/UX** — utmost
  attention to detail. The gate stays on every outbound/write (the gate is the
  product). Don't replace the roadmap / tracker / deck tools — reason across them.
  Single-operator first.
- **Hard pillars (faked on mock here, but design honestly):** candidate generation
  (raw signal → proposals worth attention) and the people/org model.

## Build / run
`make project` after adding/removing Swift files. `make build-debug` + `make
run-debug` from `~/Projects/Steward`. `make test` and `swift test` both green (the
Screen↔web contract test now asserts the 5 new ids).
