# Steward: Target State

## What "done" means here

"Done" is not the current prototype with more screens bolted on. It is a different center of gravity.

The prototype closes errands: see a signal, reason a chain, send something, file an artifact, archive it. A Technical Director's week is not errands. It is open loops that persist across days — a commitment half-forgotten after a meeting, a fire whose severity changes by the hour, a roadmap date drifting under you, a budget ask sitting with Finance for a week. The done state is built around those loops, with the errand-closing mechanic from the prototype as one Move type inside it, not the whole product.

This document describes that target, not how to get there. Two of its load-bearing pillars — turning raw signal into proposed work, and modeling who owns what — are research-hard rather than merely engineering-hard, and are flagged where they appear.

## The core model: Objects and Clusters

The platform is two primitives. **Everything is one Object** — a Move, an Obsidian note, a Slack message, a person, a loop, an alert, a search result — differing only in type, lineage, and body. One acceptance rule governs them all: a thing can never *be* a Move, but a Move can *contain* it. **Clusters** group Objects and are the home. Auto-clustering, per-cluster Moves, artifacts, and scoped chat are all just operations on these two things.

Loops and Moves live inside that model. A **loop** is an open Object with an owner, a counterparty, a state, and an age ("waiting on Priya for the pad spec"). A **Move** is the unit of action: a linear spine of reasoned nodes with approval gates, and the correct-and-recompute interaction intact. A Move opens a loop, advances one, or closes one. The prototype's Log was a graveyard of finished things; here the spine that matters is **what you are carrying**, and the Log is only the part of it that has closed.

## The home: the Cluster board

The board is a glanceable grid of Cluster cards — hand-assembled, or model-generated during regular structuring passes. An auto-cluster carries a confidence and must be gated and correctable, because a wrong cluster mis-scopes the model, which is worse than no cluster. Drilling in reveals the Cluster's info, its search, and its member Objects, with an artifacts toggle for what the Cluster has produced.

One search component spans the board and every Cluster: a discrete bar → a focused "ask anything" typeahead → a floating chat. The user's search box and the model's retrieval tool hit the **same** hybrid index, so they never drift. Scope is one knob — weight in-cluster results up, optionally see outside, or lock in — not two systems.

## Surfaces become lenses

Desk, Carrying, Meetings, Roadmap, Vault, Sources, and Log do not disappear; they become lenses over Objects that work globally or scope to a Cluster.

- **Desk** ranks present-tense attention by **severity × needle-impact**, with confidence demoted to a quality signal. Fires surface to the top and, past a threshold, interrupt (Reactive mode: urgency, escalation, change-since-last-look, notifications that reach you outside the app).
- **Carrying** is every open loop in one place — commitments, waits, asks in flight, fire status, roadmap risk — each with its age and next nudge.
- **Meetings** is a first-class object: a prep brief before, capture during, and commitments that fan out of the transcript into Carrying after, with decisions logged.
- **Roadmap** is reconciliation, not creation: Steward notices when reality and the plan disagree and surfaces slips and broken dependencies as loops.
- **Vault** is the Obsidian-backed note store — canonical markdown on disk, the Object is metadata pointing at it. **Sources** keeps the MCP mesh and swappable engine, and adds the people/org model and financial data.
- **Log** is the closed slice of Carrying, with each Move's full trace preserved.

Move types generalize the spine into a small set, all keeping the gate and recompute: errand, delegate/route, escalate (fire), prep (read-only, no send gate), reconcile (roadmap slip), and pitch (budget and exec artifacts — numbers and a deck, not a Jira ticket). High-stakes recipients raise the bar on the gate rather than passing through a flat one. Corrections stick across Moves: tell Steward "we standardize on Arctic" once and it persists.

## The engine underneath

One local-first index is the engine: every source (vault, files, MCP, web) embeds into a single hybrid space (vector + keyword/BM25), and that one retrieval path serves both the search box and the model. The split that organizes storage is origin, not searchability: **authored/vault-native Objects are files on disk (the source of truth); ingested/ephemeral Objects live in the index** with a YAML projection on demand. Editing a note writes its markdown and re-derives the metadata — never a YAML rewrite of its content.

## What carries over unchanged

The interaction model was already right. The linear spine with gates, the correct-and-recompute loop (verify to the live edge, adjust a node, watch downstream re-derive while verified steps hold), tiered autonomy (read and reason freely, gate every outbound and every write), the MCP-mostly source strategy, the provider-agnostic engine, and the integrity stance (confidence is Steward's estimate, never measured truth) all survive intact.

## What is hard, and what "done" excludes

Two things are genuinely hard. **Candidate generation** — turning raw signal into proposed Moves worth your attention — is the central unsolved problem; the proposed cold-start is an overnight job that back-traces each real outcome (a filed ticket, a sent message) into a `move.trace` you can inspect and correct, so generation imitates your patterns instead of guessing. The **people/org model** is the second: the difference between useful delegation and confident misrouting, and it degrades silently as ownership data goes stale.

Done state excludes, on purpose: nothing unsupervised on anything outbound or destructive (the gate is the product, not a speed bump to remove); it does not replace the roadmap tool, issue tracker, or deck tool — it reasons across them and writes into them; and it is single-operator first, with multi-user a later layer. This is written to the Technical-Director archetype we discussed — treat the role-shaped parts as a strong hypothesis to test against a real week, not settled requirements.
