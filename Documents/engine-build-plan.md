# Steward Engine Build Plan: replacing the mock with real data

Status: proposal. Written against the repo at `/Users/mlockyer/Projects/Steward` on 2026-06-14.

This plan turns the all-mock UI into one backed by a real local engine: ingest a wide range of office sources, embed them with the local `jina-embeddings-v5-omni-small` CoreML model, and serve one hybrid retrieval path to both the React UI and the agent. It does not redesign the product. The target state (`DONE.md`), the object model (`CLUSTERS.md`), and the surface spec (`Documents/Handoff/docs/steward-ui-spec.md`) stand; this is the engineering path to make their data real.

## Decisions this plan is built on

Three forks were settled before writing, plus the model location:

- **Transport: a localhost HTTP daemon.** `StewardIndex` grows from a library into the engine, exposed over `127.0.0.1`. The React UI and the Node agent call the same endpoints. This matches today's `fetch("/api/*")` model, keeps one retrieval path, and keeps CoreML in Swift where it belongs.
- **Scope: the mechanizable substrate plus the two hard pillars.** Ingestion, embeddings, hybrid search, live vault, sources health, and clustering are the substrate. Candidate generation (signal to proposed Moves) and severity tagging are in scope too, treated honestly as research-hard and built so their output is inspectable and correctable rather than hidden.
- **Model: the CoreML `.mlpackage`s already exist** at `/Users/mlockyer/Projects/CoreML/jina-embeddings-v5-omni-small`. The work is wiring them behind the `Embedder` protocol and extending that protocol to image and audio. The attached fp32 PyTorch towers (`*_retrieval_fp32.safetensors`) plus the `*_meta.json` fixtures are the golden reference for validating that the CoreML output matches the source model.

A note on that last point: I could not read the CoreML directory from this workspace (only the `Steward` folder is mounted). The embedder section is grounded in the attached towers and fixtures and in the prefix convention already encoded in `Embedder.swift`. To wire the actual `.mlpackage`s later, that folder needs to be reachable, or the models copied into the repo or a known bundle path.

## What is already real, and what is mock

The split matters because it tells us what to build versus what to wire up.

| Layer | State today | Gap to close |
|---|---|---|
| Hybrid index (SQLite FTS5 + cosine + RRF) | Real, tested (`IndexStore`) | Chunk-level storage, provenance, ANN at scale |
| Embedder protocol | Real, text-only, `HashingEmbedder` mock | Multimodal CoreML impl; modelID/space tagging |
| Vault parse + ingest | Real, one-shot scan (`Vault.ingestVault`) | File-watch, incremental re-embed, non-md types |
| Object/Cluster schema | Designed + verified (TS + Swift port) | Persisted in the engine; acceptance rule enforced |
| Bridge | navigate/theme/insets/notify only | RPC + push, or the HTTP daemon path below |
| Agent world | `world.js` keyword corpus mock | Tools call the real retrieval path |
| UI data | `data.js` seed (loops, moves, clusters, roadmap, sources, log) | Sourced from the engine |
| Loops / Moves / severity / alerts | Mock seed only | The hard pillars: candidate gen + scoring |

The encouraging part: the hardest-to-get-right piece, the hybrid retrieval math, is already real and under test. Most of this plan is ingestion, the embedder, and binding the UI to the engine.

## The architecture

```
   Obsidian vault (.md, pdf, xlsx, png, ...)        Connectors
   FSEvents watch  +  one-shot scan          web servers | MCP | files | images | audio/video
            │                                              │
            ▼                                              ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  StewardIndex  (one bundled, separate SPM package)            │
   │                                                              │
   │   Ingestion: Source adapters → normalize → extract text →    │
   │              chunk → embed → upsert (with provenance)        │
   │                                                              │
   │   Embedder:  jina-embeddings-v5-omni-small (CoreML/ANE)      │
   │              text · vision · audio  →  shared 1024-dim       │
   │                                                              │
   │   IndexStore: SQLite  FTS5 (BM25)  +  vector cosine          │
   │               RRF fusion · scope knob · ref graph            │
   │                                                              │
   │   Object store: notes, files, messages, people, clusters,   │
   │                 loops, moves, alerts, sources, decisions    │
   └───────────────┬──────────────────────────────────────────────┘
                   │  stewardd  (localhost HTTP + SSE)
        ┌──────────┴───────────┐
        ▼                      ▼
   React UI (fetch)      Node agent /api/chat
   search box,           retrieval + object tools
   vault, board,         (replaces world.js)
   sources, carrying
```

The native app hosts the WKWebView and starts the engine. The engine runs in-process (the package opens a localhost listener on a background queue) so the CoreML model loads once and there is no child-process supervision. A thin executable target wraps the same library for headless and dev runs, and for the case where the Node agent needs the engine without the app running. Both satisfy "bundled but separate SPM package": the package is separate, the app links it, it speaks HTTP.

## 1. The multimodal CoreML embedder

The current `Embedder` is text-in, vector-out. `jina-embeddings-v5-omni-small` is three towers into one 1024-dim space, so the protocol grows a modality.

**Protocol shape.** Add a multimodal entry point alongside the text one, so callers that only have text keep the simple path:

```swift
public enum Modality: Sendable { case text(String), image(Data), audio(Data) }

public protocol Embedder: Sendable {
    var modelID: String { get }          // "jina-v5-omni-small@<rev>"
    var dimension: Int { get }           // 1024
    func embed(_ items: [Modality], kind: EmbedKind) async throws -> [[Float]]
}
```

Keep `EmbedKind` and its `Query:` / `Document:` prefixes: they are jina v5's retrieval convention and already correct. Keep `HashingEmbedder` as the offline/test implementation so CI and `swift test` build without the 2 to 4 GB of weights.

**The CoreML implementation.** One actor wrapping three `MLModel`s (text, vision, audio) plus the shared projector if it is separate from the towers. Responsibilities:

- Tokenize text with the Qwen vocab (151,672 entries per `text_config.json`). This needs the model's tokenizer; vendor it or load it from the model directory.
- Preprocess image to the patch grid the vision tower expects (`vision_meta.json`: `grid_thw [1,32,32]`, `pixel_values_shape [1024,1536]`) and audio to the mel features the audio tower expects (`audio_meta.json`: `packed_shape [128,200]`).
- Run the tower, pool the token sequence to one vector, L2-normalize. The towers emit sequences (`out_shape` is `[seq,1024]`: text variable, vision `[256,1024]`, audio `[50,1024]`). The pooling rule (mean, last-token, or a learned retrieval head) and any prefix handling must be **validated against the fp32 reference**, not assumed. That is what the fixtures are for.
- Set `MLModelConfiguration.computeUnits = .all` (ANE first, GPU fallback), fp16 io, batch where the tower allows it.

**Parity test (the gate for this milestone).** A test target that, for each tower, feeds the fixture input and asserts the CoreML output is within tolerance of the attached `*_retrieval_fp32.safetensors` reference at the documented `out_shape`. This resolves pooling and preprocessing empirically and guards against silent drift when the `.mlpackage` is re-exported. Until this passes, the pipeline runs on `HashingEmbedder`.

**Space hygiene.** Every stored vector is tagged with `modelID` (the schema already has `model_id`). Search refuses to mix spaces. Switching embedding providers marks the affected rows stale and enqueues a reembed, which is what drives the staleness UI in Sources and the Vault footer. This is the one place the spec is firm: changing the model must visibly reembed, never silently compare across spaces.

**Risk.** The text tower is ~600M params; fp32 on disk is 2.3 GB. fp16 or palettized CoreML weights cut memory and latency materially with little recall loss; plan to ship quantized and keep the fp32 path only for the parity test. Measure embed latency on a real vault early, because it sets the ceiling on "save a note, see it searchable."

## 2. Ingestion: the generic-provider abstraction

The user framed every source as one of: a generic web server, an MCP server, file artifacts, images, video, audio. So the ingestion layer is one protocol with adapters, not bespoke code per integration.

```swift
public protocol Source: Sendable {
    var id: String { get }                       // "vault", "slack", ...
    func enumerate() async throws -> [SourceItem] // what exists now
    func fetch(_ item: SourceItem) async throws -> RawDocument
    func watch(_ onChange: @Sendable (SourceChange) -> Void) -> WatchToken?  // optional live
}
```

Each `RawDocument` flows through one fixed pipeline: **normalize → extract text (and/or modality blobs) → chunk → embed → upsert with provenance**. The adapters differ only in `enumerate/fetch/watch`; the pipeline is shared, which is what keeps "a wide array of apps and tools" from exploding into N pipelines.

Adapters to build, in priority order:

- **Vault (FS).** The primary source. Markdown is already parsed; this adds non-md files and the watcher (section 3).
- **File artifacts.** PDF, docx, xlsx, pptx. Text extraction per type. The repo already leans on document tooling; reuse it. Store the file as a pointer (Obsidian exception), index the extracted text.
- **Images.** Vision tower embedding, plus optional OCR/caption text so an image is reachable by keyword too.
- **Audio and video.** Audio tower embedding over the track; transcript via a local speech model when available, chunked like any document. Video is audio plus sampled keyframes through the vision tower.
- **Generic web server.** A configured HTTP/REST/RSS endpoint, polled on the sweep schedule, each item normalized to a document.
- **MCP server.** Read tools mapped to `enumerate/fetch`; the existing connector framing in Sources fits here directly.

Provenance (source id, external id, path or URL, byte offsets for chunks) rides every chunk so retrieval can cite back to the exact origin, which Studio and prep briefs both require.

## 3. The live vault: "aware when added, and start embedding"

This is called out explicitly, so it gets its own treatment. Today `ingestVault` is a one-shot scan. The requirement is liveness: a file appears or changes, and the engine embeds it without a manual trigger.

- **Watcher.** An `FSEventStream` (or `DispatchSource` for the simple case) on the real Obsidian directory, debounced (Obsidian writes in bursts). Translate raw events to `created | modified | deleted | renamed`.
- **Incremental work.** Each file carries a content hash. On change, diff against the stored hash; re-chunk and re-embed only what changed; for a delete, drop the object and its chunks. A first run still does the full scan to establish the baseline.
- **Reporting.** Emit `vault.changed` and `index.progress` over the daemon's event stream (SSE), which is what drives the Vault file tree updating underneath the user and the "13 notes / 184 chunks" footer becoming real.
- **Concurrent Obsidian edits.** The vault is live while Obsidian may be open, which the handoff flags as a data-loss risk, not a nicety. Policy: the `.md` on disk is always source of truth (pointer storage, never rewrite a note as YAML); on an external change to a file open in the app's editor with unsaved edits, surface a conflict rather than overwrite. Start with last-write-plus-reload and a visible conflict flag; do not silently merge.

The same path serves "drag a PDF into a folder" and "Obsidian saves a daily note": both are `created/modified` events into the one pipeline.

## 4. Persistence and the object model

`IndexStore` already has `objects`, `objects_fts`, `vectors`, and `edges`. Two additions make it the real store:

- **Chunks.** Today `upsert` embeds an entire body as one vector. Real documents need chunk-level vectors with a parent-object ref, so retrieval returns passages with provenance and long files do not collapse to one fuzzy vector. Add a `chunks` table (chunk id, parent object id, ordinal, text, offsets) and store vectors per chunk; object-level hits roll up from their best chunk.
- **Typed object columns / bodies.** Persist the full primitive set from `CLUSTERS.md` (note, file, message, person, cluster, move, move.trace, loop, alert, source, decision) with their bodies, and enforce the one acceptance rule from the verified schema (`schema-swift/ObjectModel.swift`) on writes through the daemon. The TS validator stays the authoring linter; the Swift registry guards the engine.

Storage follows origin, per the invariant: authored and vault-native objects are files on disk; ingested and ephemeral objects live in the index with a YAML projection available on demand, not written as millions of files.

## 5. The hybrid retrieval path and the daemon

One path, two callers. The daemon exposes the engine; `world.js`'s mock tools are replaced by calls to it.

`stewardd` endpoints (HTTP, plus SSE for push):

- `GET /search` and `POST /retrieve`: hybrid search and chunk retrieval with scope and provenance. `IndexStore.search` and its `Scope` knob already implement the fusion and the in-cluster boost.
- `/objects` CRUD, `/vault/*` (tree, readNote, writeNote, move, rename, delete), `/clusters`, `/loops`, `/alerts`, `/sources`, `/index/status`, `/ingest`.
- `GET /events` (SSE): `alert`, `chat.token`, `index.progress`, `vault.changed`, `loop.updated`, `sweep.status`.

These are the `bridge-rpc.ts` methods and events, reshaped as HTTP rather than postMessage. The contract is already designed; this realizes it over the chosen transport.

**Agent rewire.** In `agent.js`, `read_source`, `find_related`, and `find_parts` stop reading the hardcoded corpus and call `/retrieve` and `/objects`. The agent's retrieval tool and the UI search box now hit the identical endpoint, which is the "one retrieval path, never drift" invariant made literal. The write tools (`draft_and_send`, `create_artifact`) keep their approval gate unchanged; only their backing data becomes real.

One seam to name: `agent.js` runs as Vite middleware, present in dev but not in a static release build. In dev the agent calls `stewardd` directly. In release the agent runtime is unsettled (move the loop into `stewardd`, or bundle a Node sidecar). It does not block the substrate and is listed in open decisions.

## 6. Clustering (mechanizable)

The board is Clusters, and a good chunk of clustering is just the embedding space at work. A periodic structuring pass takes object vectors, finds neighborhoods (cosine threshold plus a community-detection step), and proposes clusters with a confidence. Proposals below a threshold are gated for review, which is exactly what `clusterStats.needsReview` already expects in the UI. Merge, split, and correct are one gesture, and corrections feed back so the next pass respects them. Runs on a schedule and on events (for example before a meeting). A wrong cluster mis-scopes the model, so the gate is mandatory, not cosmetic.

## 7. The hard pillars (in scope, handled honestly)

These decide whether the product works, and the docs are right that they are research-hard and degrade silently. The discipline is to make their output visible and correctable, not to pretend they are solved.

**Severity tagging (drives Desk and the auto-alert).** Desk ranks by severity times needle-impact. Start with an explicit scorer over real inputs: incoming source signals (a Datadog-style alert, a failing check), loop age versus its nudge SLA, dependency criticality from the roadmap graph, and recipient stakes from the people model. When severity crosses the `fire` threshold, the state transition auto-emits an `alert`, the second of the two alert triggers alongside the model's `raise_alert` tool. Confidence stays Steward's estimate, never measured truth: the integrity invariant holds. Begin rules-plus-small-scorer; do not reach for a learned model until there is labeled history.

**Candidate generation (the cold-start, highest risk, longest).** The proposed mechanism is the overnight exit-to-`move.trace` back-trace. An exit is a real outcome (a filed ticket, a sent message, a booked invite); start with that explicit set, not fuzzy ones. A nightly job takes each new exit, retrieves the evidence that led to it, reconstructs the Move that produced it (which enter signal, which middle steps), and stores it as a first-class `move.trace` object that is inspectable and correctable. Those reconstructions are labeled examples of good Moves grounded in real work, fed back so generation imitates patterns instead of guessing. Build the inspection-and-correction surface first, because the quality of these traces is the product, and you cannot tune what you cannot see.

**People / org model.** The ownership graph powers delegation and escalation targets. Seed it from the vault People notes and connector membership. It degrades silently as ownership goes stale, so low-confidence routes are flagged rather than executed confidently. This is the difference between useful delegation and confident misrouting.

**Roadmap drift and meetings** are smaller but real. Drift: compare plan dates against incoming signal and emit roadmap-risk loops when reality and the plan disagree. Meetings: ingest calendar and transcripts, generate prep briefs by retrieving open loops and history per attendee, and extract commitments and decisions that fan out into loops and vault decision notes.

## 8. Surface-by-surface mapping

Every mocked surface, its real source, and how it is verified.

| Surface | Real data source | Layer | Verify |
|---|---|---|---|
| Vault | FS service + watcher + chunk/embed | substrate | edit a note, see it re-embed and become searchable |
| Studio search | `/retrieve` over the hybrid index | substrate | same query, same hits as the UI search box |
| Sources | source adapters + sweep + index status | substrate | connect one source, watch status and counts move |
| Board (Clusters) | clustering pass over object vectors | substrate | proposed cluster gated below threshold, correctable |
| Carrying (loops) | loop store fed by signal + scoring | pillar | a real signal opens a loop with owner/state/age |
| Desk | severity times needle-impact ranking | pillar | a fire outranks a tidy summary |
| Reactive alert | auto-emit on `fire` + model tool | pillar | severity crossing raises the banner and a macOS notification |
| Meetings | calendar + transcript ingest | pillar | a transcript fans commitments into Carrying |
| Roadmap | milestone model + drift detector | pillar | a slipped date surfaces a reconcile loop |
| Log | closed-loop records with Move trace | substrate | close a loop, it graduates with its trace intact |

## 9. Packaging: the bundled, separate SPM package

`StewardIndex` stays one package and gains products and structure:

- **Products:** `StewardIndex` (library, the engine) and `stewardd` (executable, the headless wrapper). The app links the library and starts the listener in-process; the executable exists for dev and for the agent-without-app case.
- **Dependencies, kept lean.** System `sqlite3` (already linked). `CoreML` is a system framework. For the HTTP listener, prefer `Network.framework` (`NWListener`, localhost only) to stay zero-external-dependency and offline-buildable, consistent with the package's current ethos; a small server library is a fallback if request routing gets heavy. The tokenizer is the one likely vendored asset.
- **Targets:** `StewardIndex` (existing), `StewardIndexEmbeddersCoreML` (kept separate so the core builds without weights), `stewardd`, and the test targets including the new embedder parity suite.
- **Wire into the app.** Add the local package to `Package.swift` and `project.yml` as a dependency of `SwiftUITemplate`, run `make project`, and confirm it compiles in the real target (today nothing in `Sources/` references it). Keep both test paths green: `make test` (xcodebuild) and `swift test`.
- **Offline and testable.** `HashingEmbedder` keeps the whole pipeline exercisable with no model present, so tests and CI never need the 2 to 4 GB of weights.

## 10. Phasing

Each milestone is shippable and independently verifiable.

- **M0. Package wiring and the embedder gate.** Link `StewardIndex` into the app, stand up the `stewardd` skeleton and the SSE channel, and land the CoreML embedder behind the protocol with its parity test passing against the fixtures. Exit: the daemon answers `/search` on the existing index, and CoreML output matches the fp32 reference.
- **M1. The live-vault vertical slice.** Real Obsidian directory, watcher, incremental embed, chunking, surfaced in Vault and Studio search, replacing those two mocks. Exit: save a note in Obsidian, see it searchable in the app within seconds, with provenance. This is the user's core requirement end to end.
- **M2. The generic sources.** File, web, MCP, image, and audio adapters plus the sweep scheduler, making Sources real with live status and counts. Exit: connect one of each kind and retrieve across them in one query.
- **M3. Object model and clusters.** Persist the full primitive set with the acceptance rule enforced, and the clustering pass with the confidence gate, making the board real. Exit: a gated auto-cluster the user can correct.
- **M4. The pillars, first cut.** Severity scoring and the auto-alert, the loop store and Carrying, roadmap drift, and meeting ingest. Exit: a real signal becomes a ranked loop on Desk and, past threshold, a banner.
- **M5. Candidate generation.** The overnight exit-to-`move.trace` job and the correction feedback loop, with the inspection surface first. Exit: a real exit reconstructs an inspectable, correctable trace.

The substrate (M0 to M3) is engineering-bounded and where confidence is highest. M4 and M5 are the research-hard pillars; expect iteration and keep their output visible throughout.

## 11. Verification strategy

- **Embedder parity** against the attached fp32 towers and `*_meta.json` fixtures, per tower, within tolerance. This is the gate for M0 and the guard against re-export drift.
- **Existing `StewardIndex` tests stay green both ways** (`make test` and `swift test`) as the package grows.
- **A golden retrieval set:** a handful of queries over a known fixture vault with expected top hits, so fusion changes are caught.
- **End-to-end vault liveness test:** write a file, assert it is embedded and retrievable, modify it, assert re-embed, delete it, assert removal.
- **Daemon contract tests** asserting the HTTP responses match the `bridge-rpc.ts` shapes the UI expects.
- For the pillars, where unit tests are weaker, lean on inspectable artifacts (the `move.trace` objects, the severity inputs) so quality is reviewable rather than asserted.

## 12. Open sub-decisions (none block M0 or M1)

- **Release-mode agent runtime.** `agent.js` is Node middleware, absent from a static release. Move the loop into `stewardd`, or bundle a Node sidecar. Decide before release, not before the substrate.
- **HTTP server choice.** `Network.framework` recommended for zero dependencies; revisit only if routing grows.
- **Embedding quantization** (fp16 vs palettized) for the text tower, chosen on measured latency and recall against the golden set.
- **Chunker parameters** (size, overlap, markdown-structure awareness) tuned on the real vault.
- **Exit taxonomy** for candidate generation: start explicit (ticket, invite, sent message) before anything fuzzy.
- **Tokenizer sourcing** for the Qwen vocab: vendored asset versus loaded from the model directory.
```