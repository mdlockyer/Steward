# Steward: Target State

## What "done" means here

"Done" is not the current prototype with more screens bolted on. It is a different center of gravity.

The prototype closes errands: see a signal, reason a chain, send something, file an artifact, archive it. A Technical Director's week is not errands. It is open loops that persist across days. Commitments made in a meeting and then half-forgotten. A fire whose severity changes by the hour. A roadmap date that quietly drifts under you. A budget ask sitting with Finance for a week. The done state is the version of Steward built around those loops, with the errand-closing mechanic from the prototype as one Move type inside it, not the whole product.

This document describes that target. It does not describe how to get there. Two of its load-bearing pillars (turning raw signal into proposed work, and modeling who owns what) are research-hard rather than merely engineering-hard, and I have flagged those where they appear.

## The core model: loops and Moves

Everything Steward tracks is an open loop. A loop has an owner, a counterparty or audience, a state, and an age. "Waiting on Priya for the pad spec" is a loop. "Q3 capture milestone depends on the codec decision" is a loop. "Two test rigs, budget ask sitting with Finance since Tuesday" is a loop. A loop closes when the thing it waits on resolves.

A Move is still the unit of action: a linear spine of reasoned nodes with approval gates, and the correct-and-recompute interaction is intact. What changes is what a Move does to loops. A Move can open a loop (send the ask), advance one (nudge, escalate, gather the missing input), or close one (file the ticket, publish the decision). The spine, the per-node confidence, the gated outbound and write steps, and recompute-from-a-node all carry over without change. Those primitives were right. They were pointed at too small a target.

The reframe in one line: the prototype's Log was a graveyard of finished things. In the done state, the spine that matters is **what you are carrying**, and the Log is only the part of it that has closed.

## Surfaces

**Desk** is the present-tense attention surface: what needs you right now. The prototype ranked by confidence alone, which cannot tell a fire from a retro summary. Done-state Desk ranks by **severity × needle-impact**, with confidence demoted to a quality signal on the proposal rather than its priority. Fires do not wait politely at the bottom of a list; they surface to the top and, past a severity threshold, interrupt (see Reactive mode).

**Carrying** is the new substrate and the largest addition. It is every open loop in one place: commitments you made, things you are waiting on, asks in flight, fire status, roadmap risks. Each loop shows its age and its next nudge. This is the surface that matches how the role is actually experienced, and meetings, fires, roadmaps, and budget are mostly views onto it rather than separate features.

**Meetings** is a first-class object, not just a transcript fed in after the fact. Before: a prep brief (what this is about, what you owe these people, what is open with them, what decisions are pending). During: capture. After: commitments fan out of the transcript into Carrying as tracked loops, and decisions land in a decision log.

**Roadmap** is treated as a living document, so its value is reconciliation rather than creation. Steward watches the signals that contradict the plan ("X just said they will miss the date that Y depends on") and surfaces slips and broken dependencies as loops, with a Move to adjust the plan or send the status that the slip now requires.

**Sources** keeps its job (the MCP mesh and the swappable reasoning engine) and gains two new inputs: the people and org model, and financial data. Reads stay relatively permissive; every write surface stays gated.

**Log** narrows to closed loops: the archive that Carrying graduates into, with the full trace of each Move preserved (sources, steps, and any corrections you made).

## How the four realities are served

**Meetings.** Prep brief before, commitment fan-out after. The single biggest time sink becomes the thing Steward both feeds on and feeds back into, instead of a one-way ingest.

**Roadmaps.** Drift detection and dependency reconciliation, surfaced as loops. Steward does not own the roadmap; it owns noticing when reality and the roadmap disagree.

**Fires.** A severity dimension separate from confidence, an escalation path, change detection ("worse than an hour ago"), and an interrupt model so a fire comes to find you. A fire Move's job is usually to assemble the right people and draft the stakeholder status update, not to file a ticket.

**Budget.** Two competences the prototype lacks entirely. Numbers (a budget ask needs cost reasoning, not prose) and exec-facing artifacts (a pitch is a deck and a justification narrative, not a Jira ticket). A budget loop tracks the ask from draft through the approval chain and nudges at each stall.

## Capabilities rolled in

**Delegation and a people/org model.** A director accomplishes through their team; they route more than they execute. Every Move can delegate or reassign, and Steward knows enough about who owns what to route correctly and to pick the right escalation target. In the prototype, Steward "found a thread with Dmitri" but had no idea what Dmitri owns. Here it does. (This model is one of the hard pillars: it is only as good as the org data it can see, and stale ownership data produces confidently wrong routing.)

**Reactive mode.** The prototype assumes a deliberative posture: you have time to read a spine and adjust a node. Fires need the opposite. Reactive mode adds urgency, escalation, change-since-last-look, and notifications that reach you outside the app.

**Audience-aware stakes.** A budget message to your VP is not a peer Slack ping. High-stakes recipients raise the bar on the approval gate (more confirmation, a preview of exactly what goes out, sometimes a second look) rather than passing through the same flat gate as a low-stakes one.

**Cross-Move memory.** Corrections stick. When you tell Steward "we standardize on Arctic," it does not relearn that on the next Move. Standards, decisions, and preferences persist and feed future reasoning. This is also what makes delegation and reconciliation improve over time instead of resetting.

**Move types.** The spine generalizes into a small set, all of which keep the gate and recompute mechanics: errand (the original), delegate/route, escalate (fire), prep (a read-only meeting brief, no external write, so no send gate), reconcile (roadmap slip), and pitch (budget and other exec artifacts).

## What carries over unchanged

The interaction model is the part of the prototype that was already right, and the done state does not touch it. The linear spine with gates, the correct-and-recompute loop (verify down to the live edge, adjust a node, watch everything downstream re-derive while verified steps hold), tiered autonomy (read and reason freely, gate every outbound and every write), the MCP-mostly source strategy, the provider-agnostic reasoning engine, and the integrity stance (confidence labeled as Steward's estimate, never as measured truth) all survive intact.

## What is hard, and what "done" deliberately excludes

Two things are genuinely hard, not just unbuilt. **Candidate generation** (turning raw signal across all sources into proposed Moves worth your attention) is the central unsolved problem; the prototype fakes it completely, and the quality of everything downstream depends on it. The **people/org model** is the second; it is the difference between useful delegation and confident misrouting, and it degrades silently when the underlying data goes stale.

Done state deliberately excludes a few things to stay honest about its job. Steward does not act unsupervised on anything outbound or destructive; the gate is the product, not a speed bump to remove later. It does not replace the roadmap tool, the issue tracker, or the deck tool; it reasons across them and writes into them. It is a single-operator tool first; multi-user, shared loops, and team-wide rollout are a later layer, not part of this target.

One caveat on scope. This is written to the Technical-Director-at-a-large-studio archetype we discussed, not from inside knowledge of any specific org's tooling or process. Treat the role-shaped parts as a strong hypothesis to test against a real week, not as settled requirements.
