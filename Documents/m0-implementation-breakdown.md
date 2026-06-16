# M0 implementation breakdown

The first milestone from `engine-build-plan.md`, turned into ordered, reviewable steps. M0 ends when the daemon answers `/search` over the existing index and the CoreML embedder matches the fp32 fixtures.

Every step lists the files it touches, the change, and how to verify it. Two steps (M0.4, M0.5) need the macOS toolchain or the model weights and are marked accordingly. The rest are pure Foundation and provable by the package's existing `swift test`.

A constraint worth stating up front: these were not compiled when written. The package links `sqlite3` and (after this milestone) `CoreML` and `Network`, which are Apple-only, so the build runs on your machine, not in a Linux sandbox. Treat the code blocks as precise sketches, run the verify command after each.

## M0.1 Multimodal Embedder protocol

The current protocol is text-only. Grow it to multimodal without breaking a single existing call site.

Files: `Packages/StewardIndex/Sources/StewardIndex/Embedder.swift`.

The design keeps the one-text method as a convenience shim, so `IndexStore.upsert` (`embed(obj.body, kind: .document)`) and `search` (`embed(query, kind: .query)`) stay exactly as they are.

```swift
public enum Modality: Sendable {
    case text(String)
    case image(Data)   // encoded image bytes; preprocessing lives in the impl
    case audio(Data)   // encoded audio bytes
}

public protocol Embedder: Sendable {
    var modelID: String { get }
    var dimension: Int { get }
    /// Core requirement: a batch of modalities in, one vector each out.
    func embed(_ items: [Modality], kind: EmbedKind) async throws -> [[Float]]
}

public extension Embedder {
    // Back-compat shims. Existing call sites compile unchanged.
    func embed(_ text: String, kind: EmbedKind) async throws -> [Float] {
        guard let v = try await embed([.text(text)], kind: kind).first else {
            throw EmbedError.empty
        }
        return v
    }
    func embedQuery(_ text: String) async throws -> [Float] { try await embed(text, kind: .query) }
    func embedDocument(_ text: String) async throws -> [Float] { try await embed(text, kind: .document) }
}

public enum EmbedError: Error { case empty, unsupportedModality(String) }
```

`HashingEmbedder` moves its logic into the batch method and keeps text-only behavior (image/audio throw `unsupportedModality`, which is honest for a hashing mock):

```swift
public func embed(_ items: [Modality], kind: EmbedKind) async throws -> [[Float]] {
    try items.map { item in
        guard case let .text(text) = item else {
            throw EmbedError.unsupportedModality("hashing mock is text-only")
        }
        return Self.hashVector(text)   // the current body, factored out
    }
}
```

Acceptance: `IndexStore` and `Vault` compile with no call-site edits. `HashingEmbedder` still produces the same vectors for text.

Verify: `cd Packages/StewardIndex && swift test`. The `VaultTests` and `IndexStoreTests` suites must stay green.

## M0.2 Chunk-level storage (additive)

Today `upsert` stores one vector and one FTS row per object. Real documents need passage-level retrieval with provenance. Add this alongside the object-level path so nothing existing breaks; the full cutover lands in M1 with the vault slice.

Files: `Packages/StewardIndex/Sources/StewardIndex/IndexStore.swift`, plus a new `Chunker.swift`.

New table in the schema block:

```sql
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,         -- "<objectId>#<ordinal>"
  object_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  text TEXT NOT NULL,
  start INTEGER NOT NULL,      -- byte offset into the source body, for citation
  end INTEGER NOT NULL,
  dim INTEGER NOT NULL,
  vec BLOB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chunks_object ON chunks(object_id);
```

`Chunker.swift` is pure Foundation and deterministic, so it is unit-testable on its own: split on markdown structure first (headings, paragraphs), then pack to a target token budget with overlap. Start simple (fixed size with overlap), refine on the real vault.

Retrieval rolls up: a query embeds once, scores chunk vectors, and an object's score is its best chunk's score. `SearchHit` gains an optional `bestChunkId` and offsets so the UI can cite the passage, not just the file.

Acceptance: a new `ChunkerTests` suite (deterministic boundaries, overlap, offsets), and an `IndexStore` test that a multi-paragraph note returns the relevant passage's chunk id. Object-level search behavior is unchanged for short bodies.

Verify: `swift test` with the two new tests passing.

## M0.3 The stewardd daemon skeleton

One localhost listener over the existing index. Library plus a thin executable, so the app links the library and a headless run is possible.

Files: `Packages/StewardIndex/Package.swift` (new products/targets), new `Sources/StewardServer/` (the HTTP + SSE layer), new `Sources/stewardd/main.swift` (the executable).

`Package.swift` grows:

```swift
products: [
    .library(name: "StewardIndex", targets: ["StewardIndex"]),
    .library(name: "StewardServer", targets: ["StewardServer"]),
    .executable(name: "stewardd", targets: ["stewardd"]),
],
targets: [
    .target(name: "StewardIndex", linkerSettings: [.linkedLibrary("sqlite3")]),
    .target(name: "StewardServer", dependencies: ["StewardIndex"]),
    .executableTarget(name: "stewardd", dependencies: ["StewardServer"]),
    .testTarget(name: "StewardIndexTests", dependencies: ["StewardIndex"]),
    .testTarget(name: "StewardServerTests", dependencies: ["StewardServer"]),
]
```

`StewardServer` uses `Network.framework` (`NWListener` bound to `127.0.0.1`, no external dependency), parses a minimal request line plus body, and routes:

- `GET /search?q=...&scope=...&k=...` returns `IndexStore.search` hits as JSON.
- `POST /retrieve` returns chunks with text, object id, score, offsets.
- `GET /events` holds the connection open and writes SSE frames (the push channel: `index.progress`, `vault.changed`, later `alert`).
- `GET /health` for the app's supervisor check.

The response shapes mirror `Web/src/schema/bridge-rpc.ts` so the UI binds without translation.

Acceptance: `stewardd --db <path> --port 0` starts, `/health` returns ok, `/search` returns the same hits `IndexStore.search` produces in a unit test, and an `/events` client receives a test `index.progress` frame.

Verify (macOS): `swift run stewardd --db /tmp/steward.sqlite` then `curl 127.0.0.1:<port>/search?q=thermal`. Plus `StewardServerTests` driving the router in-process.

## M0.4 Wire the package into the app (needs the macOS build)

Until now the engine is standalone; nothing in `Sources/` references it. Link it.

Files: `Package.swift` (root), `project.yml`.

Add `StewardIndex` and `StewardServer` as local package dependencies of the `SwiftUITemplate` target. In `project.yml`, add the local package reference and the target dependency, then regenerate. The app starts the listener in-process on launch (a background queue) and points the WebView's `fetch` at `127.0.0.1:<port>`, or injects the port via the existing bridge bootstrap.

Acceptance: `make project` succeeds, the app target compiles against the package, and a debug run reaches `/health`.

Verify (macOS): `make project && make run-debug`, confirm the app hits the daemon. Keep `make test` and `swift test` green.

## M0.5 CoreML embedder and the parity gate (needs the model folder)

The milestone's gate. Wire the three `jina-embeddings-v5-omni-small` towers behind the multimodal protocol and prove the CoreML output matches the source model.

Files: new target `Sources/StewardEmbeddersCoreML/` (kept separate so the core builds without weights), `CoreMLEmbedder.swift`, the tokenizer asset, and `Tests/EmbedderParityTests/`.

`CoreMLEmbedder` is an actor holding the text, vision, and audio `MLModel`s. Per modality: preprocess (tokenize text with the Qwen vocab; patch-grid the image per `vision_meta.json`; mel-features the audio per `audio_meta.json`), run the tower, pool the token sequence to one 1024-dim vector, L2-normalize. Set `computeUnits = .all`.

The pooling rule is the one real unknown and the parity test is how it gets resolved, not guessed. The test, for each tower, feeds the fixture input and asserts the CoreML vector is within tolerance (cosine > 0.999, say) of the attached `*_retrieval_fp32.safetensors` reference at the documented `out_shape` (`audio_meta.json` 50x1024, `vision_meta.json` 256x1024, text variable x1024). Try mean and last-token pooling; keep whichever matches.

Two inputs are needed here that this workspace did not have: the `.mlpackage`s under `/Users/mlockyer/Projects/CoreML/jina-embeddings-v5-omni-small`, and that folder reachable by the build. Decide whether the models are bundled into the app `Resources` or loaded from a known path.

Acceptance: parity test green for all three towers; switching `IndexStore` from `HashingEmbedder` to `CoreMLEmbedder` keeps the golden retrieval set's top hits stable (modulo the better model improving them).

Verify (macOS, with weights): `swift test --filter EmbedderParity`.

## Order and dependencies

M0.1 and M0.2 are independent and pure Foundation; do them first and they are fully verifiable by `swift test` here on your machine. M0.3 depends on M0.1. M0.4 depends on M0.3. M0.5 depends on M0.1 and the model folder, and is the gate that flips the default embedder from mock to real. After M0.5 passes, M1 (the live-vault slice) is the next vertical.
