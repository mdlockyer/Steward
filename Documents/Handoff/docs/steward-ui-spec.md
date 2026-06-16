# Steward: UI Feature Spec

A high-level map of every UI surface and the data and operations each one implies. The goal is not to design the backend here, it is to make its shape fall out of the UI. Each surface lists **Features** and then **Backend needs**, and those needs accumulate into the boundary described in section 6.

## 0. The architecture this is written against

Steward is a hybrid macOS app. A native SwiftUI shell owns the sidebar, the glass toolbar, and appearance; the detail pane is a single transparent `WKWebView` hosting the Vite + React + TypeScript app. It is local-first by construction: bundled web served over `app://local/` in release, Vite dev server in debug, all data on the machine.

One fact dominates the backend question. **The bridge today is UI-only.** Swift pushes `navigate / setTheme / setInsets`; JS posts back only `{type:"ready"}`. There is no data channel. Almost everything below needs two new bridge capabilities, so treat these as prerequisite work:

1. **Request/response RPC** (JS calls a named native method with a payload and awaits a typed result). This is how the web UI reads the vault, runs a search, lists loops, executes a Move step, and so on.
2. **Server push / streaming** (Swift emits events into the page outside of a request). This is how alerts appear, how chat tokens stream, and how reindex progress and connector sweeps report in.

The "backend" is the set of local services these two channels front. It can live in native Swift, in a local sidecar process, or split between them; section 6 lays out where each piece likely sits.

## 1. Shared primitives

Defining these once keeps the per-surface specs short and is itself most of the data model.

- **Loop** — an open thread of work. Has an owner, a counterparty/audience, a state (open, in flight, waiting, at risk, escalated, scheduled, closed), a category (commitment, ask, fire, roadmap risk, budget, waiting-on), an age, and a next-nudge time. The Carrying list is loops; the Log is closed loops.
- **Move** — the unit of action against a loop. A linear **spine** of typed **nodes** with approval **gates** and the correct-and-recompute behavior. Move types: errand, delegate, escalate, prep, reconcile, pitch. Each loop carries a recommended ready Move type (the "ESCALATE READY / PITCH READY / ..." badge).
- **Alert** — a surfaced interruption (see 2.2). Points at a Move or loop, has severity, a headline, a one-line context with timestamps, and actions. Raised two ways: a model tool call, or an automatic emit on severity tagging.
- **Source** — a data provider (vault, Slack, Jira, Outlook, Miro, meeting notes, financial data, the people/org model). Has connection state, freshness, signal count, and index/embedding status.
- **Person / Org node** — who someone is, what they own, who they escalate to. Powers delegation, audience-aware stakes, and routing. One of the two hard pillars.
- **Document** — any ingested file (vault markdown first, then arbitrary types). Has raw content, extracted text, a chunk set, embeddings, and link/tag/backlink metadata for vault files.
- **Decision** — a recorded call (leaning/decided/blocked, owner, what it blocks). Lives in the vault, surfaced from meetings and reconciliation.
- **Search query / result** — a hybrid query (vector + keyword) over the unified space, returning ranked chunks with provenance, consumed by both the user and the model.
- **Memory** — durable standards, preferences, and corrections that persist across Moves ("we standardize on Arctic").

## 2. Global chrome

### 2.1 Sidebar and status
Native sidebar: Desk, Carrying, Meetings, Roadmap, Vault, then Tools (Studio, Sources, Log), then Settings. Per-section counts, a "Listening / last swept" status, and the sample-data indicator. Selecting an item pushes a `navigate` event; React swaps the screen inside the single WebView (the existing contract, extended with the new screen ids).

**Backend needs:** live counts per surface (open loop count, unread Desk items, upcoming meetings, roadmap risks, vault note count, closed-loop count); a "last swept" heartbeat from the ingestion scheduler.

### 2.2 The Reactive alert banner
A pinned banner that rides above every surface ("A FIRE NEEDS YOU", headline, "Started 07:12, widening", **Open the Move** / **Later**). This is an Alert, and it is the clearest case for the push channel.

**Triggers (both supported, in parallel):**
- **Model-raised.** The reasoning agent has a hidden tool (for example `raise_alert(move_id, severity, headline, context)`). It is not a user-facing Studio tool; it is how the model deliberately interrupts the user when its monitoring concludes something is on fire.
- **Automatically raised.** When a Move or loop is severity-tagged `fire` (by the severity classifier or a rule), the state transition emits an Alert without any model call.

**Features:** one active banner at a time with a queue behind it; "Open the Move" deep-links to the inspector; "Later" snoozes with a cooldown; severity escalation can re-raise a snoozed alert ("worse than an hour ago").

**Backend needs:** an alert service with a store and a dedup/cooldown policy; the model tool definition and its handler; a severity-tagging step in the loop/Move pipeline that can emit alerts; the push channel to render live; native Notification Center delivery when the app is backgrounded; snooze state.

## 3. Surfaces

### 3.1 Desk — present-tense attention
**Purpose:** what needs you right now.
**Features:** a ranked feed of proposed Moves and items needing you, ordered by **severity × needle-impact** (confidence is a quality signal on each item, not the sort key); segments to filter; per-item triage (open into the inspector, dismiss with undo, snooze); the Move inspector itself (spine, per-node confidence, gates, correct-and-recompute, execute) opens from here.
**States:** populated, all-clear/empty, recomputing a node, gate pending, awaiting reply, executed.
**Backend needs:** candidate generation (the second hard pillar: turning raw signal into proposed Moves); a ranking function with severity and impact inputs; the Move execution state machine; gated executors for outbound/write steps; dismiss/snooze persistence.

### 3.2 Carrying — the open-loop substrate
**Purpose:** everything still open, what you carry across days.
**Features:** segmented tabs (All, Needs you, Waiting, Fires & risks) with counts; loop rows showing type icon, title, state, owner (avatar + name), category tag, age, and a **ready-Move badge** that launches the matching Move type for that loop (ESCALATE / RECONCILE / PITCH / ERRAND / DELEGATE / PREP READY); aging and next-nudge; open a loop to see its history and act.
**States:** per-tab populated and empty; a loop with no clear owner (delegate-ready); a stalled loop past its nudge age.
**Backend needs:** the loop store with state, owner, counterparty, category, age, and nudge timers; the loop → recommended-Move-type mapping; a nudge scheduler; the link from a loop into a Move and back.

### 3.3 Meetings — first-class object
**Purpose:** prep before, capture during, fan-out after.
**Features:** Upcoming list with a **prep brief** action per meeting (what this is about, what you owe these people, what is open with them, pending decisions) and attendee avatars; Recent list showing each meeting's commitment count; opening a recent meeting shows extracted commitments that fan out into Carrying as loops and decisions that land in the Vault decision log.
**States:** upcoming with brief ready vs brief generating; recent processed vs still transcribing; a meeting with zero extracted commitments.
**Backend needs:** calendar ingestion; transcript ingestion; a prep-brief generator that retrieves open loops and history per attendee (uses the org model and the search space); commitment and decision extraction that writes loops and vault notes.

### 3.4 Roadmap — living-document reconciliation
**Purpose:** notice when reality and the plan disagree.
**Features:** a plan/milestone view; drift and broken-dependency risks surfaced as loops (for example "codec decision slipping, Q3 capture GA at risk"); a **reconcile** Move to adjust the plan or send the status the slip now requires.
**States:** on-track, at-risk surfaced, reconcile in progress.
**Backend needs:** a roadmap/milestone model with dependencies; a drift detector that compares plan dates against incoming signal; emission of roadmap-risk loops.

### 3.5 Vault — live Obsidian vault, editor, and file tree
**Purpose:** read, write, and organize the user's existing Obsidian vault directly on disk, and make it a first-class RAG source. This is the largest new surface.
**Features:**
- **File tree** of the real vault: folders and files, including arbitrary types already present (for example `Q3-budget.xlsx`, `rig-spec.pdf`, `README`). Refined tree operations: create, rename, move (drag and drop), delete, new folder, reorganize. The tree reflects on-disk state and updates when the vault changes underneath it.
- **Markdown editor and viewer** with a Read / Edit toggle. Editor is intuitive and Obsidian-compatible: frontmatter and status pills (for example `leaning`, `@Marcus Chen`), `[[wikilinks]]`, `#tags`, callout blocks, daily notes.
- **Backlinks** panel (the "4 backlinks" view) and the link graph between notes.
- **Note search** box scoped to the vault.
- **RAG status** surfaced inline ("13 notes / 184 chunks indexed", "indexed for RAG", per-note "updated 2d ago").
- Opening non-markdown files: preview where possible; always ingest text for search.
**States:** read vs edit; unsaved changes; file changed on disk by Obsidian while open (conflict); a file not yet indexed; an unsupported binary (search-only, no inline render).
**Backend needs:** a vault filesystem service (read/write/move/rename/watch) pointed at the real Obsidian directory; a markdown parser that understands frontmatter, wikilinks, tags, callouts, and backlinks; a link-graph index; file-change watching with a conflict strategy for concurrent Obsidian edits; an ingest hook so every save re-chunks and re-embeds the changed file; text extraction for arbitrary types.

### 3.6 Studio — reasoning chat with integrated hybrid search
**Purpose:** the LLM workspace, where the model reasons over everything and the user can search the same space the model retrieves from.
**Features:**
- **Chat** with the reasoning model (provider-agnostic, Anthropic or OpenAI), streaming responses.
- **Model tools**, including the hidden alert tool, Move actions (propose, advance, execute a gated step), vault read/write, connector actions, and retrieval over the unified search space. Tool calls and their results are visible in the thread.
- **Retrieval with citations**: model answers cite the chunks they used, each click-through to the source (vault note, Slack thread, file).
- **Integrated search interface** (the explicit ask): a search box that queries the same hybrid space the model uses, with scope filters (this source, this folder, everything), ranked results with provenance, and actions to insert a result into the chat as context or open it in the Vault.
- **Model and embedding selection**: pick the chat model and the embedding model (local vs OpenAI vs Google) per the local-first stance.
**States:** idle, streaming, tool running, retrieval in progress, empty search, no results, citation hover/expand.
**Backend needs:** the LLM/agent service with the tool registry and streaming; the retrieval API over the hybrid index (shared with the user search box, so one search path serves both); citation/provenance plumbing; conversation persistence; model/provider config.

### 3.7 Sources — connectors, index health, and engines
**Purpose:** what Steward listens to, how fresh it is, and how it is indexed.
**Features:** the provider list (the MCP mesh plus the vault) with connection state, freshness, signal count, and **index/embedding status per source** (indexed, indexing, stale, error); the people/org model and financial data as sources; the **embedding configuration** (local model over localhost as default, OpenAI or Google as alternates) and the reasoning-engine choice; manual **reindex** and reconnect controls. Reads stay permissive; every write surface stays gated.
**States:** connected, needs-reauth, error, indexing with progress, stale and queued.
**Backend needs:** the connector/MCP service with per-source auth and sweep scheduling; index status per source; embedding-provider configuration and switching; reindex triggers and progress reporting over the push channel.

### 3.8 Log — closed loops
**Purpose:** the archive Carrying graduates into.
**Features:** completed Moves with full trace (sources touched, steps, any corrections), the terminal artifact, and timing; filter and search; reopen a loop if it turns out not to be closed.
**States:** populated, empty, a reopened loop returning to Carrying.
**Backend needs:** closed-loop records with their Move trace; reopen transition back into the loop store.

## 4. The unified search space (ingestion, embedding, RAG)

This is the cross-cutting subsystem behind Vault search, Studio search, retrieval, prep briefs, and candidate generation. The principle the user stated: every provider ingests and embeds into one centralized hybrid space that both the user and the model query through the same path.

**Pipeline:** ingest per source (vault files on save and on watch events; connectors on sweep) → normalize and extract text (per file type for arbitrary files) → chunk → embed (swappable provider) → store in a local vector index plus a local keyword index → **hybrid retrieval** (vector similarity plus keyword/BM25, merged and reranked) → returned with provenance to whichever caller asked (user search UI or model retrieval tool).

**Embedding providers:** local model served over localhost as the default (local-first), with OpenAI or Google embedding models as configured alternates. Switching providers implies a reembed of affected content, so the UI must show index staleness and reindex progress (Sources, Vault footer).

**Stores:** all local. The vault on disk stays the source of truth for its files; the index and embeddings are a derived local database. Connector content is cached and indexed locally.

**Freshness:** vault file-watch for instant reindex of edited notes; connector sweeps on a schedule; per-source status in Sources; counts in the Vault footer.

**Backend needs (consolidated):** an ingestion scheduler and per-type text extractors; a chunker; an embedding service abstraction with at least three backends; a local vector store and a local keyword index with a hybrid query API and a reranker; one retrieval API shared by user and model; provenance carried end to end for citations.

## 5. Cross-cutting UI behaviors

- **Tiered autonomy / gates:** every outbound or write step in any Move shows an approval gate; the gate is the product, not a speed bump. Audience-aware stakes raise the gate for high-stakes recipients (preview, extra confirmation).
- **Correct-and-recompute:** available wherever a Move spine renders (Desk inspector, loop actions in Carrying, reconcile, pitch).
- **Provenance and citation:** any model-produced claim or retrieved fact is traceable to a source, in Studio and in prep briefs.
- **Memory write-back:** corrections made in any Move persist as Memory and feed future reasoning.

## 6. The backend boundary this implies

Two bridge channels (section 0) front a set of local services. Likely placement, for the user to decide:

- **Vault FS service** — read/write/move/rename/watch the Obsidian directory, markdown parsing, link graph. Natural fit for native Swift (Foundation file APIs, FSEvents).
- **Index / search service** — chunking, vector store, keyword store, hybrid query, rerank, provenance. Either native (SQLite plus a vector extension) or a local sidecar (a vector store such as LanceDB or Chroma). This is the main native-vs-sidecar decision.
- **Embedding service** — local-over-localhost default plus OpenAI/Google adapters. If local embedding uses a Python or Node runtime, that is the strongest reason to run a sidecar and put the index service next to it.
- **LLM / agent service** — chat, the tool registry (including the hidden alert tool), streaming, retrieval calls. Provider-agnostic.
- **Connector / MCP service** — per-source auth, sweeps, gated executors for writes.
- **Loop + Move store** — loops, Move spines and node state, gates, the loop→Move mapping, nudge timers, Log. The transactional core; a local database (SQLite/GRDB or Core Data).
- **Org model store** — people, ownership, escalation paths.
- **Alert service** — store, dedup/cooldown, the two triggers, push delivery, native notifications.

Streaming concerns (chat tokens, reindex progress, alerts, sweep status) all ride the push channel, so design that channel for ordered, typed, multiplexed events rather than one-off messages.

## 7. Open decisions the UI cannot settle

- **Native Swift vs local sidecar for RAG and embeddings.** The local-embedding requirement leans toward a sidecar; the local-first and single-binary instincts lean toward native. This is the first call to make, because the index service tends to follow it.
- **Vector store choice** (SQLite + sqlite-vec vs LanceDB vs Chroma vs other), tied to the above.
- **Embedding default and reembed cost.** Local default for privacy and cost, API for quality; switching reembeds, so confirm how aggressively to surface staleness.
- **Concurrent Obsidian edits.** The vault is live and Obsidian may be open at the same time. Needs a file-watch plus conflict policy (last-write, merge, or prompt), since this is a real data-loss risk, not a nicety.
- **Streaming transport over the bridge** (chunked postMessage events vs a localhost WebSocket the page connects to directly). The second is simpler for token streaming and may be why the user framed this as "a locally hosted web server."
- **The two hard pillars: candidate generation and severity tagging.** What actually sets a Move "on fire" (the automatic trigger), and what generates proposals in the first place, are model-and-heuristic problems, not UI. The UI above will render whatever they emit; their quality decides whether the product works.

---

*Written against the repo at `/Users/mlockyer/Projects/Steward` (hybrid SwiftUI + WKWebView + React, bridge currently UI-only) and the four current screenshots. The screenshots are the design target; the web screens in the repo are still template placeholders, so nothing here assumes existing web implementation beyond the bridge contract in `Web/src/bridge.ts` and `Sources/Web/WebBridge.swift`.*
