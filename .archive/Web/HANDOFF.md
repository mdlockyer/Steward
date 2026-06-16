# Steward — Project Handoff

**What it is.** A working front-end prototype of *Steward*, an executive chief-of-staff agent. It watches a producer/director's tool exhaust (Slack, Jira, Confluence, Miro, Outlook, meeting notes — over MCP), reasons across it, and proposes **Moves**: small, complete reasoned action chains that the user reviews, corrects, and executes. Current state is UI + mock data only — no backend, no real integrations.

**Vocabulary (load-bearing).**

- **Move** — the smallest reasoned unit of accomplishment. A linear spine of nodes with gates, ending in an artifact or comms. *(name provisional)*
- **Node types** — `observe → connect → retrieve → send → await → create`. `send` and `create` are approval gates.
- **Correct-and-recompute** — the signature interaction. Verified nodes are settled; you adjust at the live edge; everything downstream invalidates and re-derives; then you execute.
- **Tiered autonomy** — read/reason runs on its own; any outbound message or write is approval-gated.
- **Three surfaces** — *Desk* (triage proposals), *Sources* (the MCP mesh + reasoning engine), *Log* (executed history).

**Decisions already made.**

- Aesthetic target: "Apple if it made Jira" — clean/minimal, light, SF system font (`-apple-system`), hairline grouped lists, one accent, soft shadows. Explicitly *not* SaaS-dashboard, *not* editorial.
- IA: real destinations only (Desk / Sources / Log); push-navigation into the inspector.
- Move shape: linear spine with gates, **not** a free-form DAG.
- Integrity stance: all mock data is labeled; confidence is shown as *Steward's estimate*, never as measured truth; every write is gated.

**What exists.** One file, `src/Steward.jsx` (~one component; CSS injected at runtime), wrapped in a Vite scaffold. Builds clean on Node 22 (58 kB gzipped). The hero Move (the thermal-pad example) is fully drivable end-to-end: Adjust → recompute → accept → approve & send → simulate reply → execute → lands in Log. Other Moves exercise the review / in-flight / unsure states; Sources shows a needs-reauth connector; dismissing a row shows undo and the empty Desk.

**Real vs. mock.** *Real:* the entire interaction model, the recompute state machine, navigation, and every reachable state (review / in-flight / unsure / gate / await / recomputing / executed / empty / reauth / undo). *Mock:* all content; the recompute is one scripted alternate branch on the hero Move (other nodes do a generic "revised" pass); the "simulate reply" button stands in for an inbound webhook; confidence values are placeholders.

**Architecture for whoever extends it.** All state lives in the top `App` (`route`, `openId`, `moves[]`, `log[]`, `toast`, feedback fields). A Move holds `nodes[]`; each node's `status` enum drives rendering and available actions. Recompute = `patchNodes` to set downstream nodes to `recomputing`, then a `setTimeout` swaps in `alt` content. No router, no persistence, no `localStorage`.

Known shortcuts to clean up before this is more than a prototype: a decorative `<span>` sits inside an `<ol>` (cosmetic, non-semantic); non-hero nodes only do a generic recompute; status dots rely on a `fill` prop on the lucide `Circle`; everything is one file (fine now, split later).

**Open questions — pending your call.**

1. Inspector layout: master-detail (list + spine side by side, more Mac-app-like) vs. the current push-navigation.
2. Ranking model: pure confidence vs. confidence × needle-impact — this changes what the Desk leads with.
3. Naming: *Steward* and *Move* are both placeholders.
4. How much branching Moves actually need (currently linear + gates; real EA work sometimes forks).
5. **Candidate generation is the unsolved hard part** — turning raw signals into proposed Moves. The demo fakes this entirely.

**Path to a real build.** MCP read adapters per source → a candidate-generation pass (the hard part) → an LLM planner that emits the node graph (provider-agnostic) → durable per-node state with real recompute-from-node → gated executors (Slack send, Jira/Confluence/calendar writes) behind approval. After that: auth and permission scoping, an audit log, dedup/noise control, multi-user.

**Run it.** `cd steward-app && npm install && npm run dev` (Node 18+). The SF font only renders as intended on Apple hardware. Source of truth is `src/Steward.jsx`; the zip's README covers build/preview.