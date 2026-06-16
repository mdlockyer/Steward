# Steward: Handoff

Entry point for continuing Steward in Claude Code. It states what exists, what is verified, the invariants to preserve, and the next reversible steps. It does not re-explain the product; for that, read in this order: `docs/steward-done-state.md` (the target), `docs/CLUSTERS.md` (the object model and the Clusters reframe, which supersedes Moves-as-home), `docs/steward-ui-spec.md` (every surface and the backend it implies).

## The app, in three sentences

Steward is a local-first macOS chief-of-staff app: a native SwiftUI shell hosting a React/TS web UI in one `WKWebView`, over a Swift-JS bridge. Everything in it is one `Object` (a Move, an Obsidian note, a Slack message, a person, a cluster, a search result), grouped into `Cluster`s, which are the home. The reasoning model watches ingested data, proposes `Move`s (reasoned action chains with approval gates), and the user reviews, corrects, and executes them.

## What is in this bundle, and its verification status

- `schema-ts/` — the object model in TypeScript + Zod. **Verified: typechecks clean and `npm run check` passes** (the hierarchy rules, all example objects, cross-object ref acceptance, the storage rule). This is the source of truth for the data model.
  - `src/base.ts`, `src/registry.ts`, `src/types.ts`, `src/validate.ts` — schema, registry, acceptance rule, validator.
  - `src/bridge-rpc.ts` — the typed bridge contract (RPC methods + push events), against the Object types. **Verified: typechecks.**
  - `examples/*.yaml` — one valid instance per primitive, wired into a real graph.
- `schema-swift/` — the Swift port of the base Object, registry, and acceptance rule, so the native index enforces the same hierarchy. **Verified: typechecks under Swift 6 language mode (strict concurrency) and the behavior demo passes (ALL CHECKS PASSED).** Same acceptance results as the TS.
- `bridge/BridgeRPC.swift` — the native side of the bridge contract (envelopes, method/event names, service protocol sketch). Mirrors `schema-ts/src/bridge-rpc.ts`, which is authoritative. Inspected, not compiled.
- `docs/` — the three design docs above.

## Verify before building on it

```bash
cd schema-ts && npm install && npm run typecheck && npm run check   # expect ALL CHECKS PASSED
cd ../schema-swift && swiftc -typecheck ObjectModel.swift main.swift # expect no output
# or run the Swift behavior check:
cd schema-swift && swiftc ObjectModel.swift main.swift -o /tmp/steward-demo && /tmp/steward-demo
```

## Invariants to preserve (do not let these drift)

1. **One acceptance rule.** A slot requiring type `T` accepts object `O` iff `T` is in `O`'s lineage (`registry.accepts`). A Slack message can never *be* a Move, but a Move can *contain* one. Both the TS validator and the Swift registry must agree.
2. **Role lives on the Move spine edge, not the Object.** The same object is the exit of one Move and the enter of another. `dominantRole` on the Object is a cache, never authoritative.
3. **Storage, with the Obsidian exception.** `inline` objects (Moves, Clusters, indexed messages) are canonical as the object. `pointer` objects point to a canonical external file in its NATIVE format. Vault-backed documents (Obsidian notes, arbitrary files) default to `pointer`: the markdown (or pdf, xlsx) stays on disk as the source of truth, and the Object is metadata that points to it. Editing a note writes the `.md` and re-derives the metadata; never rewrite a note's content as YAML.
4. **One retrieval path.** The user search box and the model's retrieval tool hit the same hybrid index (`search.hybrid` / `search.retrieve`). Do not grow a second search system.
5. **Tiered autonomy.** Read and reason freely; every outbound or write step is an approval gate. The gate is the product.
6. **The alert is push-triggered two ways.** The Reactive banner is raised by the model's hidden `alerts.raise` tool OR auto-emitted when a Move/loop is severity-tagged `fire`. Both land on the same `alert` event.

## The build context (from AGENTS.md)

Hybrid app. Native shell in `Sources/` (flat), web in `Web/` (Vite + React + TS, hand-rolled tokens in `theme.css`). `project.yml` is the XcodeGen source of truth; run `make project` after adding Swift files. The bridge today (`Web/src/bridge.ts`, `Sources/Web/WebBridge.swift`) carries only `navigate/setTheme/setInsets` + `ready`. The repo's web screens are still `loremIpsum`/`dolorSit` placeholders.

## Integration steps (suggested order)

1. Drop `schema-ts/src/*` into `Web/src/schema/` and wire the validator as the object linter.
2. Port `schema-swift/ObjectModel.swift` into `Sources/ObjectModel/`, add to `project.yml`, `make project`, confirm it compiles in the real target.
3. Build the bridge's two missing channels (RPC + push) per `bridge-rpc.ts` / `BridgeRPC.swift`. This is the gating work; nothing else is reachable without it. Start with `alerts.raise` + the `alert` event, since that one path exercises the model tool registry, the push channel, and severity tagging together.
4. Decide native-vs-sidecar for embeddings + the vector index before building search (see open decisions).
5. Then surfaces, leaf-first, against real bridge data.

## Open decisions (the UI cannot settle these)

- **Native Swift vs a local sidecar for RAG and embeddings.** Local embedding over localhost leans toward a sidecar; the index service tends to follow it. Settle first.
- **Vector store** (SQLite + sqlite-vec vs LanceDB vs Chroma), tied to the above.
- **Concurrent Obsidian edits.** The vault is live while Obsidian may be open. Needs file-watch plus a conflict policy. This is a data-loss risk, not a nicety.
- **Streaming transport.** Chunked postMessage events vs a localhost WebSocket the page connects to directly.
- **The two hard pillars.** Candidate generation (raw signal to proposed Moves) and the people/org model. The UI renders whatever they emit; their quality decides whether the product works. The overnight exit-to-`move.trace` learning loop (`docs/CLUSTERS.md`) is the proposed cold-start for the first pillar.

## Placement

These files are not yet written into the repo (they live in this bundle). The TS schema + bridge contract and the Swift port are both verified. Drop the bundle where the repo expects it, or it can be written into `/Users/mlockyer/Projects/Steward` directly (HANDOFF.md at root, `schema-ts/src` into `Web/src/schema/`, `ObjectModel.swift` into `Sources/ObjectModel/` plus a `project.yml` entry and `make project`).
