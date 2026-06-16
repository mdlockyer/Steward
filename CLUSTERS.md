# Steward: Clusters and the Object Model

This supersedes the "Desk / Moves are the home" framing in `DONE.md`. Moves do not go away; they stop being the center. The center is Clusters, and Moves become one Object type that a Cluster produces.

## The whole platform is two primitives

- **Object.** Everything is one. A Move, an Obsidian note, a Slack message, a RAG result, a person, an AI session, a loop, an alert: all instances of one base Object (`src/base.ts`). They differ only in `type`, their lineage (`extends`), and their `body`.
- **Cluster.** The container, and the home board. A Cluster groups Objects. Auto-clustering, artifact clusters, per-cluster Moves, and the scoped chat are all just operations on these two things.

Everything below is a consequence of those two.

## One Object, three relationships

The model only works if three relationships stay distinct. The Slack-message-inside-a-Move case is the one that breaks naive designs, and it is the test the schema is built to pass.

1. **`extends` is identity.** Single-parent lineage to the root `object` (`src/registry.ts`). It governs exactly one thing: what a typed slot will accept.
2. **`refs: contains` is composition.** Any Object may hold references to any other Object. A Cluster contains Moves, notes, people, sessions. A Move contains a Slack message, a file, a search hit.
3. **`refs: relates` is the graph.** Typed edges: `about`, `blocks`, `produced-from`, `owns`, `mentions`, `explains`.

**The acceptance rule, stated once and mechanized in `registry.accepts`:**

> A slot that requires type `T` accepts Object `O` if and only if `T` is in `O`'s lineage.

A Move slot requires `move`. A Slack message's lineage is `[slack.message, message, object]`, which has no `move`, so a Slack message can never *be* a Move. But `Move.contains` accepts `object`, so a Move can *hold* that Slack message. The verified checks in `src/check.ts` assert exactly this.

## The registered hierarchy

Single parent per type; body composition mirrors the lineage (`noteBody` extends `documentBody`, `slackBody` extends `messageBody`). Defined in `src/types.ts`:

```
object
├── document → note, file
├── message  → slack.message, email.message
├── person
├── cluster  → cluster.artifact
├── move
├── move.trace
├── ai.session
├── search.result
├── loop
├── alert
├── source
└── decision
```

Adding a primitive is one `registry.register(...)` call with a parent and a body schema. Things that must accept only certain children declare `slots`; things constrained on association declare `relations` (a `cluster.artifact` must be `produced-from` a `cluster`, enforced in the schema).

## YAML as the face, the index as the engine

Your instinct (everything is a YAML object, parsed and linted by an existing library) is right for authoring and wrong for runtime. The distinction is the whole architecture.

The schema is defined once as Zod (`src/validate.ts`). YAML is one serialization of it. `fromYaml` parses and validates; `toYaml` writes it back. That gives you the human-facing, lintable, Obsidian-compatible, git-diffable object files you want. What it is *not* is the query layer. Draw the line by origin:

- **Authored and vault-native Objects** (notes, Moves, Clusters, decisions): real YAML-fronted files on disk. Source of truth.
- **Ingested and ephemeral Objects** (Slack messages, connector rows, search results): Objects in the local index, with a YAML projection available on demand but not written as millions of files.

The index is the engine (the ref graph, vector plus keyword search, loop and Move state, fast cluster queries). The YAML files are the editable face. The file-watch and ingest pipeline keeps them in sync. Settle this boundary first; everything hangs off it.

## The dashboard: board and detail

- **Board (home).** A grid of Cluster cards, Trello-style, glanceable. Clusters are hand-assembled out of any Objects, or model-generated during its regular structuring passes and populated with what it is confident is strongly related (usually a project, sometimes a team, a workgroup, or a Slack-native clique). Auto-clusters carry a `confidence` and must be gated and correctable, because a wrong cluster mis-scopes the AI, which is worse than no cluster.
- **Detail.** Drill into a Cluster: its info sits on top, the search sits below it, and scrolling down reveals the grid/list/arranged views of its member Objects, with type-specific layouts and multiple sorts. This is the close-up that the board's overview is not.
- **Artifacts toggle.** A Cluster produces artifacts (see the search flow). They live in the Cluster's artifact area as `cluster.artifact` objects. A toggle swaps the Cluster grid for its artifact-clusters, the same gesture on the board and in detail.

Per-Cluster Moves are generated periodically, on manual trigger, or on events (for example before a meeting).

## The search component: one component, three states

Identical on the board and in Cluster detail. The only difference is default scope: global on the board, this-Cluster in detail.

1. **Discrete bar.** Sits quietly inline.
2. **Focused.** Click and it expands to the "Ask anything" layout from the Dia screenshots: a typeahead dropdown that streams hybrid-search hits and suggested chats/actions as you type, plus "Add tabs or files".
3. **Submitted.** Enter collapses it into a floating right-hand sidebar chat over the content, not intrusive. Selecting a dropdown hit drops that Object in as context and primes the model to talk about it, add it to the Cluster, or produce an artifact.

The point of this surface: go to a Cluster, pop in, say "I need X, Y, Z because I have a meeting with so-and-so", and it already knows what to grab and produces an artifact into the Cluster's artifact area.

Scope is one knob (`scopeConfig` in `src/base.ts`), not two systems: `boostInScope` weights in-cluster results up, `allowGlobal` lets retrieval see outside, `hardScope` locks it in. This is how "keep project objects in context with preferential weight" and "can still see outside, configurable" stay a single mechanism.

## Retrieval and the unified space

Every provider (the vault, arbitrary files, MCP servers, web) ingests and embeds into one centralized hybrid space, and the user search box and the model's retrieval tool hit the same path so they never drift apart. Arbitrary files get text-extracted before chunking. Embeddings are local-first over localhost by default, with OpenAI or Google as configured alternates; switching reembeds, so index staleness is surfaced. This is section 4 of the UI spec, unchanged; Clusters add the scope knob on top of it.

## Learning from exits

This is the part to protect, because it solves the candidate-generation cold-start.

Role (`enter | middle | exit`) lives on the Move spine edge, not on the Object, because the same Slack message is the exit of one Move and the enter of another. Exit Objects are real outcomes: a filed ticket, a sent message, a booked invite. A configurable overnight job takes each new exit and back-traces the evidence to reconstruct the Move that produced it (which enter signal, which middle steps), and stores that as a first-class `move.trace` Object (`src/types.ts`) so it is inspectable and correctable rather than a hidden training artifact. Those reconstructions are labeled examples of good Moves grounded in your real work, fed back so generation imitates your patterns instead of guessing. Your corrections to a trace become stronger signal.

## How the eight surfaces become lenses

Desk, Carrying, Meetings, Roadmap, Vault, Studio, Sources, and Log do not disappear. They become lenses over Objects that work globally or scope to a Cluster. Carrying is loops (global, or filtered to one Cluster); a Cluster detail view shows that Cluster's slice of each lens. Clusters are simply the grouping axis laid over everything the prior spec already defined. The Reactive fire banner stays global, since alerts cut across Clusters.

## Open decisions

- **YAML-face vs index-engine boundary.** Settle first. Which Object origins are files, which are index-only.
- **Auto-clustering confidence gate.** A wrong cluster is worse than none. Needs a threshold, one-gesture merge/split/correct, and corrections fed back.
- **What counts as an exit.** Start with explicit types (ticket, invite, sent message) before fuzzy ones ("a Slack message that fits the criteria"). This is the classifier that drives the learning loop.
- **Single vs multiple inheritance.** The schema uses single-parent (clean tree, simple acceptance). If a real mixin case appears, the registry can be extended to a parent list, but do not reach for it pre-emptively.
