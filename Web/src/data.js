/* ============================================================================
   STEWARD — the mock world. ALL DATA IS SAMPLE / FICTIONAL.

   The product reframe: Steward is not an errand-closer, it is a loops-and-Moves
   tool. Everything tracked is an *open loop* (owner, counterparty, state, age).
   A *Move* opens a loop, advances one, or closes one. The errand is just one
   Move type. The Log is only the closed slice of what you are Carrying.

   This file is the single source of truth for that world. Every surface (Desk,
   Carrying, Meetings, Roadmap, Sources, Log) is a lens onto these structures.
   Dates are expressed as human `age` strings + an `ageRank` (smaller = older)
   so the demo never drifts no matter when it is run.
   ========================================================================== */

import {
  Radio, MessageSquare, Ticket, Layers, PenLine, Inbox, Calendar, DollarSign,
  Users, FileText,
} from "lucide-react";

/* ------------------------------- people / org ---------------------------- */
/* The people model: who owns what. Delegation and escalation route through it;
   the doc flags this as research-hard — here it is faked but modeled honestly. */
export const PEOPLE = {
  you:    { id: "you",    name: "You",          role: "Technical Director", team: "Studio Eng", initials: "YO", color: "#1d1d1f", owns: ["the slate", "exec reporting"], stakes: "self" },
  priya:  { id: "priya",  name: "Priya Menon",  role: "Eng Lead, Capture",  team: "Capture",    initials: "PM", color: "#0a6dff", owns: ["M-series test rigs", "capture pipeline"], stakes: "peer" },
  dmitri: { id: "dmitri", name: "Dmitri Volkov",role: "Firmware",           team: "Platform",   initials: "DV", color: "#7b5cff", owns: ["rig firmware", "audio subsystem"], stakes: "peer" },
  marcus: { id: "marcus", name: "Marcus Chen",  role: "Eng Lead, Codec",    team: "Platform",   initials: "MC", color: "#b06a00", owns: ["codec decision", "encode pipeline"], stakes: "peer" },
  dana:   { id: "dana",   name: "Dana Whitfield",role: "Finance Partner",   team: "Finance",    initials: "DW", color: "#1d7a3f", owns: ["studio budget", "capex approvals"], stakes: "lead" },
  sam:    { id: "sam",    name: "Sam Okafor",   role: "Product Lead",       team: "Product",    initials: "SO", color: "#c0392b", owns: ["roadmap", "licensing questions"], stakes: "peer" },
  lena:   { id: "lena",   name: "Lena Park",    role: "Design Lead",        team: "Design",     initials: "LP", color: "#d6336c", owns: ["design reviews", "retro"], stakes: "peer" },
  raj:    { id: "raj",    name: "Raj Patel",    role: "VP Engineering",     team: "Leadership", initials: "RP", color: "#2b2b30", owns: ["the org", "the number"], stakes: "vp" },
  legal:  { id: "legal",  name: "Legal",        role: "Counsel",            team: "Legal",      initials: "LE", color: "#6e6e73", owns: ["IP", "third-party licensing"], stakes: "lead" },
  mkt:    { id: "mkt",    name: "Marketing",    role: "GTM",                team: "Marketing",  initials: "MK", color: "#0a8f8f", owns: ["launch timing", "demos"], stakes: "peer" },
};
export const person = (id) => PEOPLE[id] || { id, name: id, initials: "?", color: "#999", role: "" };

/* ------------------------------- loop taxonomy --------------------------- */
/* A loop's TYPE says what kind of carrying it is. Its STATE says where it sits
   right now. Severity and needle-impact are Steward's estimates and drive Desk
   ranking; confidence is demoted to a per-proposal quality signal. */
export const LOOP_TYPE = {
  fire:     { label: "Fire",        ic: Radio,        color: "var(--red)"   },
  ask:      { label: "Ask in flight",ic: MessageSquare,color: "var(--accent)"},
  waiting:  { label: "Waiting on",   ic: Inbox,       color: "var(--amber)" },
  commitment:{label: "Commitment",   ic: Ticket,      color: "var(--ink-2)" },
  roadmap:  { label: "Roadmap risk", ic: Layers,      color: "var(--amber)" },
  budget:   { label: "Budget",       ic: DollarSign,  color: "var(--green)" },
};

export const STATE_META = {
  escalated: { label: "Escalated",  color: "var(--red)"    },
  blocked:   { label: "Blocked",    color: "var(--red)"    },
  atRisk:    { label: "At risk",    color: "var(--amber)"  },
  waiting:   { label: "Waiting",    color: "var(--amber)"  },
  inFlight:  { label: "In flight",  color: "var(--accent)" },
  open:      { label: "Open",       color: "var(--ink-2)"  },
  scheduled: { label: "Scheduled",  color: "var(--ink-2)"  },
};

/* severity bucket → label + color, for the dot + chip */
export function sevBucket(sev) {
  if (sev >= 85) return { key: "critical", label: "Critical", color: "var(--red)" };
  if (sev >= 65) return { key: "high",     label: "High",     color: "var(--amber)" };
  if (sev >= 40) return { key: "medium",   label: "Medium",   color: "var(--accent)" };
  return { key: "low", label: "Low", color: "var(--ink-3)" };
}

/* Desk priority = severity × needle-impact, normalised 0–100. The whole point
   of the reframe: a fire outranks a tidy high-confidence retro summary. */
export const priorityOf = (x) => Math.round((x.severity * x.needleImpact) / 100);

/* ------------------------------- move spines ----------------------------- */
/* Node shapes are compatible with the spine renderer. Node types:
   observe · connect · retrieve · assess(fire) · route(delegate) · compose(pitch
   artifact) · brief(prep) · send · await · create.
   `audience` on a send node raises the approval gate (a VP message is not a peer
   ping). `numbers`, `reassign`, `brief`, `statusUpdate` are typed artifact blocks. */

const errandNodes = [
  { id: "obs", type: "observe", title: "Flagged in this morning's standup",
    body: "Priya (Eng) said the M-series test rigs are thermal-throttling on long capture runs, which is skewing the perf numbers the team reports.",
    srcs: ["Granola · standup notes"], conf: 94, status: "settled" },
  { id: "con", type: "connect", title: "Linked to an open thread in #hw-platform",
    body: "Same throttling Dmitri raised ~3 weeks ago on a different rig. That thread was never resolved.",
    srcs: ["Slack · #hw-platform"], conf: 88, status: "settled" },
  { id: "ret", type: "retrieve", title: "Found the fix and two sourcing options",
    body: "The thread concluded a higher-conductivity thermal pad fixed it. Matched the rig spec to parts:",
    parts: [
      { name: "Gelid GP-Extreme", spec: "1.5 mm · 12 W/mK", price: "$14" },
      { name: "Thermalright Odyssey", spec: "2.0 mm · 12.8 W/mK", price: "$11" },
    ],
    srcs: ["Slack thread", "Amazon"], conf: 71, status: "edge",
    alt: { body: "Re-checked against the rig gap and your standardization note (Steward remembers: we standardize on Arctic). Filtered to Arctic, 2.0 mm:",
      parts: [
        { name: "Arctic TP-3", spec: "2.0 mm · 12.5 W/mK", price: "$16" },
        { name: "Arctic TP-3", spec: "1.5 mm · 12.5 W/mK", price: "$13" },
      ] }},
  { id: "snd", type: "send", title: "Draft a DM to Priya — send for your approval",
    to: "Priya Menon · Slack DM", audience: { who: "priya", stakes: "peer" },
    message: "Hey Priya — re: the rig throttling, looks like the same thing Dmitri hit in #hw-platform a few weeks back. The fix there was a thermal pad. Found two that match the rig spec — would either of these work? (Gelid 1.5 mm / Thermalright 2.0 mm)",
    conf: 80, status: "pending",
    alt: { message: "Hey Priya — re: the rig throttling, same issue Dmitri hit in #hw-platform. Fix was a thermal pad. Pulled two Arctic TP-3 options to match our standard and the rig gap — the 2.0 mm or the 1.5 mm. Which fits?" }},
  { id: "awt", type: "await", title: "Wait for Priya's reply", status: "pending",
    reply: "Priya: 👍 go with the 2.0 mm Arctic, order 6 of them." },
  { id: "crt", type: "create", title: "File the order as a Jira ticket — execute on your approval", status: "pending",
    ticket: { project: "HW-OPS", type: "Task",
      summary: "Order 6× Thermalright Odyssey 2.0 mm thermal pads for M-series test rigs",
      assignee: "You", links: "standup note · #hw-platform thread · Priya DM" },
    altTicket: { project: "HW-OPS", type: "Task",
      summary: "Order 6× Arctic TP-3 2.0 mm thermal pads for M-series test rigs",
      assignee: "You", links: "standup note · #hw-platform thread · Priya DM" }},
];

const fireNodes = [
  { id: "obs", type: "assess", title: "Capture pipeline is dropping frames in production",
    body: "Automated capture jobs started failing checksum at 07:12. 3 of 8 rigs affected. This is the loop you were already carrying — it just crossed into a fire.",
    srcs: ["Datadog · capture-svc", "PagerDuty"], conf: 96, status: "edge",
    severityNote: "Severity 92 · escalating" },
  { id: "chg", type: "connect", title: "Worse than an hour ago",
    body: "07:12 → 1 rig. 08:40 → 3 rigs, and the corrupted frames are now landing in the shared dataset the perf team pulls from. The blast radius is widening, not holding.",
    srcs: ["Datadog"], conf: 90, status: "pending" },
  { id: "ret", type: "retrieve", title: "Who needs to know, and who can fix it",
    body: "Dmitri owns the audio subsystem and the encode path the corruption traces to. Raj (VP) and #leadership need the status because the perf dataset feeds the board deck due Monday.",
    srcs: ["People model", "Slack · #leadership"], conf: 84, status: "pending" },
  { id: "snd", type: "send", title: "Stakeholder status update — high-stakes, send for approval",
    to: "Raj Patel + #leadership", audience: { who: "raj", stakes: "vp" },
    statusUpdate: {
      headline: "Capture pipeline degradation — contained, fix in progress",
      body: "3 of 8 capture rigs are producing corrupted frames (started 07:12, widening). Root cause traces to the encode path; Dmitri is on it. Risk: the perf dataset feeding Monday's board deck is affected — we are quarantining it now. Next update by 10:30.",
    }, conf: 78, status: "pending" },
  { id: "crt", type: "create", title: "Open the incident & quarantine the dataset — execute on approval", status: "pending",
    ticket: { project: "INC", type: "Sev-2 Incident",
      summary: "Capture pipeline frame corruption — 3 rigs, perf dataset quarantined",
      assignee: "Dmitri Volkov", links: "Datadog · PagerDuty · #leadership status" }},
];

const reconcileNodes = [
  { id: "obs", type: "observe", title: "Marcus said the codec decision will miss its date",
    body: "In #platform: \"realistically the codec call won't land until early July.\" The roadmap has it due June 20.",
    srcs: ["Slack · #platform"], conf: 91, status: "settled" },
  { id: "con", type: "connect", title: "Q3 capture GA depends on it",
    body: "Capture-pipeline GA (your committed Q3 milestone) lists the codec decision as a hard dependency. A 2-week codec slip pushes GA past the quarter unless the plan changes.",
    srcs: ["Roadmap", "People model"], conf: 86, status: "edge" },
  { id: "ret", type: "retrieve", title: "Two ways to reconcile",
    body: "Either (a) re-sequence GA to decouple from the codec call and ship with the current codec behind a flag, or (b) hold the date and send the slip up now. Steward leans (a) — it protects the quarter and keeps the decision reversible.",
    srcs: ["Roadmap"], conf: 68, status: "pending" },
  { id: "crt", type: "create", title: "Adjust the roadmap — re-sequence GA, codec as fast-follow", status: "pending",
    ticket: { project: "Roadmap", type: "Plan change",
      summary: "Decouple Capture GA from codec decision; ship behind flag, codec as July fast-follow",
      assignee: "You", links: "#platform thread · Q3 plan · dependency graph" }},
];

const pitchNodes = [
  { id: "obs", type: "observe", title: "The rig budget ask has sat with Finance since Tuesday",
    body: "Your request for 2 additional M-series capture rigs went to Dana on Jun 9. No decision yet — 6 days, past the 3-day SLA you'd set yourself.",
    srcs: ["Email · Finance", "Budget model"], conf: 89, status: "settled" },
  { id: "num", type: "compose", title: "The numbers, assembled",
    body: "A budget ask needs cost reasoning, not prose. Here is the case, costed:",
    numbers: [
      { label: "2× M-series capture rig", value: "$18,400", note: "capex · one-time" },
      { label: "Throughput gained", value: "+38%", note: "unblocks 2 parallel capture runs" },
      { label: "Cost of the delay", value: "~$6k/wk", note: "idle eng time on serialized runs" },
      { label: "Payback", value: "~3 weeks", note: "vs. current serialized pipeline" },
    ], srcs: ["Budget model"], conf: 74, status: "edge" },
  { id: "cmp", type: "compose", title: "One-page justification for Finance",
    body: "Exec-facing artifact, not a Jira ticket — a tight justification Dana can forward up.",
    brief: { kind: "Justification · 1 page",
      points: [
        "Ask: 2× M-series capture rigs, $18.4k capex.",
        "Why now: serialized capture is the critical-path bottleneck for Q3 GA.",
        "Return: +38% throughput, ~3-week payback, de-risks the committed date.",
        "Alternative considered: rent — rejected, 1.7× cost over 6 months." ] },
    srcs: ["Budget model"], conf: 71, status: "pending" },
  { id: "snd", type: "send", title: "Nudge Dana, cc your VP — high-stakes, send for approval",
    to: "Dana Whitfield · cc Raj Patel", audience: { who: "dana", stakes: "lead" },
    message: "Hi Dana — following up on the 2-rig capex ask from Jun 9. Attached a one-pager: $18.4k, +38% throughput, ~3-week payback, and it de-risks the Q3 GA date. Happy to walk through it. Cc'ing Raj for visibility since it's on the critical path.",
    conf: 76, status: "pending" },
];

const delegateNodes = [
  { id: "obs", type: "observe", title: "The audio-dropout repro has no owner",
    body: "Dmitri reproduced the audio dropout yesterday and filed notes, but nobody is assigned to drive the fix. It is sitting.",
    srcs: ["Jira · HW-1182", "Slack · #hw-platform"], conf: 88, status: "settled" },
  { id: "rte", type: "route", title: "Route to the right owner",
    body: "The dropout is in the audio subsystem. Per the people model, Dmitri owns that subsystem and already has the repro in hand — he is the correct owner, not just the nearest name.",
    reassign: { from: "Unassigned", to: "Dmitri Volkov", reason: "owns the audio subsystem; already holds the repro" },
    srcs: ["People model"], conf: 82, status: "edge" },
  { id: "snd", type: "send", title: "Draft the handoff to Dmitri — send for approval",
    to: "Dmitri Volkov · Slack DM", audience: { who: "dmitri", stakes: "peer" },
    message: "Hey Dmitri — since you've already got the audio-dropout repro and own that subsystem, can you take HW-1182 the rest of the way? I'll keep it off your standup asks elsewhere this week to make room. Shout if the scope is bigger than it looks.",
    conf: 80, status: "pending" },
  { id: "crt", type: "create", title: "Reassign the ticket — execute on approval", status: "pending",
    ticket: { project: "HW-OPS", type: "Reassign",
      summary: "Assign HW-1182 (audio dropout) to Dmitri Volkov; you remain reviewer",
      assignee: "Dmitri Volkov", links: "HW-1182 · repro notes" }},
];

const prepNodes = [
  { id: "obs", type: "brief", title: "1:1 with Priya Menon — today, 2:00pm",
    body: "A read-only prep brief. No outbound, no gate — this Move just gets you ready.",
    brief: { kind: "Prep brief",
      sections: [
        { h: "What this is about", items: ["Weekly 1:1. Light agenda; the rig throttling will come up."] },
        { h: "What you owe her", items: ["A decision on the thermal-pad order (drafted, on your Desk).", "Sign-off on her Q3 capacity plan from last week."] },
        { h: "What's open with her", items: ["Rig throttling loop (in flight).", "She's waiting on your read of the capture-GA re-sequencing."] },
        { h: "Decisions pending", items: ["Standardize rigs on Arctic pads? (Steward remembers you leaned yes.)"] },
      ] },
    srcs: ["Granola", "Carrying", "People model"], conf: 90, status: "edge" },
];

/* ------------------------------ the loops -------------------------------- */
/* The substrate. Some loops carry an active Move (surfaced on Desk); others are
   just tracked here in Carrying and advanced with a nudge / escalate / close. */
export const SEED_LOOPS = [
  { id: "lp-fire", type: "fire", title: "Capture pipeline is corrupting frames in production",
    owner: "you", counterparty: "dmitri", state: "escalated",
    severity: 92, needleImpact: 95, age: "2h", ageRank: 30, nextNudge: "now",
    srcs: ["Datadog", "PagerDuty"],
    context: "Started 07:12, widening. The corrupted frames are reaching the perf dataset that feeds Monday's board deck.",
    interrupt: true,
    move: { id: "mv-fire", type: "escalate", terminal: "Sev-2 incident", conf: 88, nodes: fireNodes },
    trace: [
      { when: "07:12", kind: "opened", label: "Datadog flagged checksum failures on rig 4" },
      { when: "08:40", kind: "escalated", label: "Spread to 3 rigs; crossed your fire threshold" },
      { when: "now", kind: "note", label: "Steward drafted a stakeholder update + incident" },
    ] },

  { id: "lp-rig", type: "ask", title: "Thermal pads Priya needs for the M-series test rigs",
    owner: "you", counterparty: "priya", state: "inFlight",
    severity: 58, needleImpact: 52, age: "3h", ageRank: 28, nextNudge: "today",
    srcs: ["Granola", "Slack", "Amazon"],
    context: "Heard in standup → matched an open thread → found the fix and parts. Propose, confirm with Priya, then file the order.",
    move: { id: "mv-rig", type: "errand", terminal: "Jira ticket", conf: 84, nodes: errandNodes },
    trace: [
      { when: "Today 09:05", kind: "opened", label: "Surfaced from the eng standup notes" },
      { when: "Today 09:20", kind: "note", label: "Linked Dmitri's prior #hw-platform thread" },
    ] },

  { id: "lp-codec", type: "roadmap", title: "Codec decision is slipping — Q3 capture GA now at risk",
    owner: "you", counterparty: "marcus", state: "atRisk",
    severity: 78, needleImpact: 84, age: "since Mon", ageRank: 12, nextNudge: "today",
    srcs: ["Slack", "Roadmap"],
    context: "Marcus said the codec call won't land until early July; GA lists it as a hard dependency.",
    move: { id: "mv-codec", type: "reconcile", terminal: "Plan change", conf: 73, nodes: reconcileNodes },
    trace: [
      { when: "Mon", kind: "opened", label: "Marcus signalled the codec date would move" },
      { when: "Wed", kind: "note", label: "Confirmed GA depends on the codec decision" },
    ] },

  { id: "lp-budget", type: "budget", title: "Budget ask for 2 more test rigs, stalled with Finance",
    owner: "you", counterparty: "dana", state: "waiting",
    severity: 70, needleImpact: 80, age: "6d", ageRank: 6, nextNudge: "overdue",
    srcs: ["Email", "Budget model"],
    context: "$18.4k capex ask sent Jun 9. No decision in 6 days — past your own 3-day SLA. On the critical path for Q3 GA.",
    move: { id: "mv-budget", type: "pitch", terminal: "Justification + nudge", conf: 75, nodes: pitchNodes },
    trace: [
      { when: "Jun 9", kind: "sent", label: "Capex ask sent to Dana (Finance)" },
      { when: "Jun 11", kind: "nudge", label: "Light nudge — no reply" },
      { when: "now", kind: "note", label: "Steward assembled the numbers + a one-pager" },
    ] },

  { id: "lp-audio", type: "commitment", title: "Audio-dropout repro needs an owner",
    owner: "you", counterparty: "dmitri", state: "open",
    severity: 50, needleImpact: 58, age: "1d", ageRank: 20, nextNudge: "today",
    srcs: ["Jira", "Slack"],
    context: "Dmitri reproduced it and filed notes, but nobody is driving the fix. It needs routing to the right owner.",
    move: { id: "mv-audio", type: "delegate", terminal: "Reassign + handoff", conf: 80, nodes: delegateNodes },
    trace: [
      { when: "Yesterday", kind: "opened", label: "Dmitri filed the repro on HW-1182" },
    ] },

  { id: "lp-priya11", type: "commitment", title: "Prep for your 1:1 with Priya at 2:00pm",
    owner: "you", counterparty: "priya", state: "scheduled",
    severity: 40, needleImpact: 60, age: "due 2pm", ageRank: 26, nextNudge: "13:45",
    srcs: ["Granola", "Carrying"],
    context: "Recurring 1:1. You owe her a thermal-pad decision and a capacity-plan sign-off.",
    meetingId: "mt-priya",
    move: { id: "mv-prep", type: "prep", terminal: "Prep brief", conf: 90, nodes: prepNodes },
    trace: [
      { when: "Recurring", kind: "opened", label: "Weekly 1:1 with Priya" },
    ] },

  /* --- tracked-only loops (no active Desk Move; advance from Carrying) --- */
  { id: "lp-legal", type: "waiting", title: "Waiting on Legal re: third-party codec license",
    owner: "you", counterparty: "legal", state: "waiting",
    severity: 45, needleImpact: 62, age: "4d", ageRank: 8, nextNudge: "tomorrow",
    srcs: ["Slack", "Email"],
    context: "Sam asked whether we can ship the third-party codec. Routed to Legal; nudged once. No answer yet.",
    trace: [
      { when: "Jun 9", kind: "opened", label: "Sam raised the licensing question in #product" },
      { when: "Jun 10", kind: "sent", label: "Routed to Legal" },
      { when: "Jun 11", kind: "nudge", label: "Nudged Legal — acknowledged, no decision" },
    ] },

  { id: "lp-bench", type: "commitment", title: "Send the latency benchmark to #platform",
    owner: "you", counterparty: "marcus", state: "open",
    severity: 35, needleImpact: 40, age: "2d", ageRank: 16, nextNudge: "today",
    srcs: ["Confluence", "Slack"],
    context: "You promised the team the latency benchmark deck in Monday's standup. Drafted, not yet shared.",
    trace: [
      { when: "Mon", kind: "opened", label: "Committed to share the benchmark in standup" },
    ] },

  { id: "lp-firmware", type: "waiting", title: "Waiting on Dmitri for the rig firmware bump",
    owner: "you", counterparty: "dmitri", state: "waiting",
    severity: 42, needleImpact: 48, age: "1d", ageRank: 19, nextNudge: "today",
    srcs: ["Jira"],
    context: "Firmware bump that unblocks the thermal mitigation. Dmitri said 'this week'.",
    trace: [
      { when: "Yesterday", kind: "opened", label: "Asked Dmitri to cut the firmware bump" },
      { when: "Yesterday", kind: "reply", label: "Dmitri: 'this week'" },
    ] },

  { id: "lp-review", type: "commitment", title: "Reschedule the design review that lost quorum",
    owner: "you", counterparty: "lena", state: "inFlight",
    severity: 38, needleImpact: 36, age: "5h", ageRank: 24, nextNudge: "today",
    srcs: ["Outlook"],
    context: "Two of three required reviewers declined. Found a window all three are free; invite drafted.",
    trace: [
      { when: "Today 06:30", kind: "opened", label: "Review lost quorum — two declines" },
      { when: "Today 07:10", kind: "note", label: "Found a common free window Tue 10am" },
    ] },

  { id: "lp-vendor", type: "ask", title: "Vendor call about capture cards",
    owner: "you", counterparty: "mkt", state: "scheduled",
    severity: 22, needleImpact: 30, age: "booked", ageRank: 22, nextNudge: "Thu",
    srcs: ["Outlook"],
    context: "Intro call with the capture-card vendor, booked for Thursday. Nothing needed from you until then.",
    trace: [
      { when: "Yesterday", kind: "opened", label: "Booked the vendor intro call" },
    ] },

  { id: "lp-vp", type: "commitment", title: "Commitment to Raj: ship the perf dashboard",
    owner: "you", counterparty: "raj", state: "atRisk",
    severity: 65, needleImpact: 78, age: "since last wk", ageRank: 4, nextNudge: "Fri",
    srcs: ["Granola", "Roadmap"],
    context: "You told Raj the perf dashboard would land this sprint. The capture fire is eating the time that was meant for it.",
    trace: [
      { when: "Last week", kind: "opened", label: "Committed the dashboard to Raj in the staff meeting" },
      { when: "now", kind: "note", label: "At risk — capture fire is consuming the sprint" },
    ] },
];

/* --------------------------------- meetings ------------------------------ */
export const SEED_MEETINGS = [
  { id: "mt-priya", title: "1:1 with Priya Menon", when: "Today · 2:00pm", whenRank: 2,
    status: "upcoming", attendees: ["you", "priya"], loopId: "lp-priya11",
    prep: {
      about: "Weekly 1:1. Light agenda; the rig throttling will come up.",
      owe: ["A decision on the thermal-pad order (drafted, on your Desk)", "Sign-off on her Q3 capacity plan"],
      open: ["Rig throttling loop (in flight)", "Your read on the capture-GA re-sequencing"],
      decisions: ["Standardize rigs on Arctic pads? (Steward remembers you leaned yes)"],
    } },
  { id: "mt-platform", title: "Platform sync", when: "Tomorrow · 10:00am", whenRank: 3,
    status: "upcoming", attendees: ["you", "marcus", "dmitri"],
    prep: {
      about: "Weekly platform sync. The codec slip and the capture fire will dominate.",
      owe: ["A reconciled Q3 plan after the codec slip (drafted, on your Desk)"],
      open: ["Codec decision date", "Audio-dropout ownership", "Firmware bump for thermal mitigation"],
      decisions: ["Re-sequence GA to decouple from the codec call?"],
    } },
  { id: "mt-standup", title: "Eng standup", when: "Today · 9:00am", whenRank: 1,
    status: "past", attendees: ["you", "priya", "dmitri", "marcus"],
    summary: "Throughput, the rig throttling, and the codec date. 4 commitments surfaced.",
    commitments: [
      { text: "Order thermal pads for the M-series rigs", owner: "you", counterparty: "priya", loopId: "lp-rig", fanned: true },
      { text: "Share the latency benchmark with #platform", owner: "you", counterparty: "marcus", loopId: "lp-bench", fanned: true },
      { text: "Cut the rig firmware bump this week", owner: "dmitri", counterparty: "you", loopId: "lp-firmware", fanned: true },
      { text: "Confirm the codec decision date", owner: "marcus", counterparty: "you", loopId: "lp-codec", fanned: false },
    ],
    decisions: [
      { text: "Perf numbers will be re-baselined once the rigs stop throttling", by: "you" },
    ] },
  { id: "mt-retro", title: "Design retro", when: "Yesterday · 3:00pm", whenRank: 0,
    status: "past", attendees: ["you", "lena", "sam"],
    summary: "23 stickies clustered into 3 themes: handoff timing, spec ambiguity, review load.",
    commitments: [
      { text: "Tighten the design→eng handoff checklist", owner: "lena", counterparty: "you", fanned: true, loopId: null },
      { text: "Reschedule the review that lost quorum", owner: "you", counterparty: "lena", loopId: "lp-review", fanned: true },
    ],
    decisions: [
      { text: "Specs require an explicit 'open questions' section before handoff", by: "lena" },
      { text: "Reviews need only 2 of 3 reviewers to keep quorum going forward", by: "you" },
    ] },
];

/* --------------------------------- roadmap ------------------------------- */
export const SEED_ROADMAP = [
  { id: "rm-ga", name: "Capture pipeline GA", date: "Jun 30", owner: "priya", status: "atRisk",
    deps: ["rm-codec", "rm-thermal"], note: "Committed Q3 milestone. At risk via the codec slip.", loopId: "lp-codec" },
  { id: "rm-codec", name: "Codec decision", date: "Jun 20", owner: "marcus", status: "slipping",
    deps: [], note: "Marcus signalled early July. This is the slip driving GA risk.", loopId: "lp-codec" },
  { id: "rm-thermal", name: "Thermal mitigation", date: "Jun 18", owner: "priya", status: "onTrack",
    deps: ["rm-firmware"], note: "Pad order + firmware bump. On track once both land.", loopId: "lp-rig" },
  { id: "rm-firmware", name: "Rig firmware bump", date: "Jun 16", owner: "dmitri", status: "onTrack",
    deps: [], note: "Dmitri committed 'this week'.", loopId: "lp-firmware" },
  { id: "rm-dash", name: "Perf dashboard", date: "Jun 27", owner: "you", status: "atRisk",
    deps: [], note: "Committed to Raj. At risk — the capture fire is eating the sprint.", loopId: "lp-vp" },
  { id: "rm-license", name: "Codec licensing cleared", date: "Jun 24", owner: "legal", status: "onTrack",
    deps: [], note: "Waiting on Legal's read.", loopId: "lp-legal" },
];

export const ROADMAP_STATUS = {
  onTrack:  { label: "On track", color: "var(--green)" },
  atRisk:   { label: "At risk",  color: "var(--amber)" },
  slipping: { label: "Slipping", color: "var(--red)" },
};

/* --------------------------------- sources ------------------------------- */
export const SEED_SOURCES = [
  { name: "Granola", scope: "Meeting notes · all standups + 1:1s", conn: "ok", fresh: "swept 4m ago", sig: 12, ic: Radio },
  { name: "Slack", scope: "#hw-platform, #product, #leadership +3", conn: "ok", fresh: "live", sig: 41, ic: MessageSquare },
  { name: "Jira", scope: "HW-OPS, DESIGN, PLATFORM, INC", conn: "ok", fresh: "swept 9m ago", sig: 8, ic: Ticket },
  { name: "Datadog", scope: "capture-svc, encode, rig telemetry", conn: "ok", fresh: "live", sig: 6, ic: Radio },
  { name: "Outlook", scope: "Calendar + flagged mail", conn: "reauth", fresh: "last ok 6h ago", sig: 0, ic: Inbox },
  { name: "Confluence", scope: "Design + Eng spaces", conn: "ok", fresh: "swept 18m ago", sig: 5, ic: Layers },
];

/* the two new inputs the doc adds to Sources */
export const PEOPLE_SOURCE = { name: "People & org model", scope: "9 people · ownership + escalation paths", conn: "ok", fresh: "synced 1h ago", note: "Routes delegation and picks escalation targets. Stale ownership data produces confidently wrong routing — Steward flags low-confidence routes.", ic: Users };
export const FINANCE_SOURCE = { name: "Financial data", scope: "Studio budget · capex · vendor spend", conn: "ok", fresh: "synced 2h ago", note: "Lets a budget Move reason in numbers, not prose.", ic: DollarSign };

export const BUDGET_LINES = [
  { label: "Q3 studio budget", value: "$1.24M", note: "62% committed" },
  { label: "Capex remaining", value: "$96k", note: "rigs, cards, storage" },
  { label: "Open ask — 2 rigs", value: "$18.4k", note: "stalled with Finance 6d", flag: true },
  { label: "Vendor spend MTD", value: "$31k", note: "on plan" },
];

/* ------------------------------ cross-Move memory ------------------------ */
/* Corrections stick. These feed future reasoning so delegation and recompute
   improve over time instead of resetting. */
export const SEED_MEMORY = [
  { id: "mem-arctic", text: "We standardize on Arctic thermal pads.", learned: "from a correction on the rig order", kind: "standard" },
  { id: "mem-codec", text: "Codec: leaning AV1, pending Marcus's call.", learned: "from the platform sync", kind: "decision" },
  { id: "mem-status", text: "Stakeholder updates go to Raj + #leadership.", learned: "from how you've routed fires before", kind: "preference" },
  { id: "mem-priya", text: "Priya prefers async DMs over meetings.", learned: "from 1:1 patterns", kind: "preference" },
];

/* --------------------------------- the log ------------------------------- */
/* The Log is only the *closed* slice of what you were carrying. Each keeps the
   full trace of the Move that closed it. */
export const SEED_LOG = [
  { id: "lg-1", title: "Filed the audio-dropout bug Dmitri reproduced", type: "errand",
    outcome: "Jira HW-1182", when: "Yesterday, 4:12pm", counterparty: "dmitri",
    trace: "2 sources · 4 steps · no adjustments", closedAge: "1d" },
  { id: "lg-2", title: "Shared the latency benchmark deck with #platform", type: "errand",
    outcome: "Slack · #platform", when: "2 days ago", counterparty: "marcus",
    trace: "3 sources · 5 steps · 1 adjustment", closedAge: "2d" },
  { id: "lg-3", title: "Closed the loop on the vendor NDA", type: "errand",
    outcome: "Outlook · signed", when: "3 days ago", counterparty: "mkt",
    trace: "1 source · 3 steps · no adjustments", closedAge: "3d" },
  { id: "lg-4", title: "Escalated last week's storage outage to a clean status", type: "escalate",
    outcome: "Resolved · #leadership", when: "Last Thu", counterparty: "raj",
    trace: "3 sources · 5 steps · 1 adjustment", closedAge: "6d" },
];

/* ------------------------------- move-type meta -------------------------- */
export const MOVE_TYPE = {
  errand:    { label: "Errand",    ic: Ticket,        hint: "send + file" },
  delegate:  { label: "Delegate",  ic: Users,         hint: "route to an owner" },
  escalate:  { label: "Escalate",  ic: Radio,         hint: "fire — assemble + status" },
  prep:      { label: "Prep",      ic: FileText,      hint: "read-only brief" },
  reconcile: { label: "Reconcile", ic: Layers,        hint: "roadmap slip" },
  pitch:     { label: "Pitch",     ic: DollarSign,    hint: "numbers + artifact" },
};

/* ============================================================================
   VAULT — the Obsidian vault, accessible directly from the app. A flat item
   list (id · parentId · type) renders as a tree and is cheap to mutate
   (rename / move / delete). Markdown files carry real content with
   [[wikilinks]] into the same world; arbitrary files are supported too. The
   vault is also a Source: chunked + embedded for RAG that Studio can query.
   ========================================================================== */
const md = (s) => s.replace(/^\n/, "");

export const SEED_VAULT = [
  /* folders */
  { id: "f-capture",   type: "folder", name: "Capture Pipeline", parentId: null },
  { id: "f-meetings",  type: "folder", name: "Meetings",         parentId: null },
  { id: "f-people",    type: "folder", name: "People",           parentId: null },
  { id: "f-decisions", type: "folder", name: "Decisions",        parentId: null },
  { id: "f-daily",     type: "folder", name: "Daily",            parentId: null },

  /* root files */
  { id: "n-readme", type: "file", ext: "md", name: "README.md", parentId: null, updated: "today",
    content: md(`
---
tags: [home, index]
---
# Studio Eng Vault

The working vault for the capture program. Steward reads this directly and keeps it indexed for [[Codec decision]]-style recall in Studio.

## Map of content
- [[Thermal throttling]] — the live rig issue
- [[Capture GA plan]] — the Q3 milestone
- [[Codec decision]] — the open call driving the slip
- [[Priya Menon]] · [[Dmitri Volkov]] · [[Marcus Chen]]

> [!note] Everything here is sample data for the demo.
`) },
  { id: "n-rigspec", type: "file", ext: "pdf", name: "rig-spec.pdf", parentId: null, updated: "3d ago", size: "1.4 MB" },
  { id: "n-budget", type: "file", ext: "xlsx", name: "Q3-budget.xlsx", parentId: null, updated: "6d ago", size: "82 KB" },

  /* Capture Pipeline */
  { id: "n-thermal", type: "file", ext: "md", name: "Thermal throttling.md", parentId: "f-capture", updated: "3h ago",
    content: md(`
---
tags: [rig, hardware, open]
owner: Priya Menon
status: in-flight
---
# Thermal throttling on the M-series rigs

The M-series test rigs **thermal-throttle on long capture runs**, skewing the perf numbers the team reports. Raised by [[Priya Menon]] in the [[2026-06-13 Standup]].

## What we know
- Same issue [[Dmitri Volkov]] hit ~3 weeks ago in \`#hw-platform\`.
- Their fix was a higher-conductivity thermal pad.
- We standardize on Arctic — see [[Thermal pad standard]].

## Parts considered
| Part | Spec | Price |
| --- | --- | --- |
| Arctic TP-3 | 2.0 mm · 12.5 W/mK | $16 |
| Thermalright Odyssey | 2.0 mm · 12.8 W/mK | $11 |

## Next
- [x] Match parts to the rig gap
- [ ] Confirm qty with [[Priya Menon]]
- [ ] File the order (HW-OPS)
`) },
  { id: "n-ga", type: "file", ext: "md", name: "Capture GA plan.md", parentId: "f-capture", updated: "1d ago",
    content: md(`
---
tags: [roadmap, q3]
status: at-risk
---
# Capture pipeline GA

Committed Q3 milestone (Jun 30). **At risk** via the [[Codec decision]] slip.

> [!warning] If the codec call moves to July, GA misses the quarter unless we decouple.

## Dependencies
- [[Codec decision]] — hard dep
- Thermal mitigation — [[Thermal throttling]]
- Rig firmware bump ([[Dmitri Volkov]])
`) },
  { id: "n-audio", type: "file", ext: "md", name: "Audio dropout.md", parentId: "f-capture", updated: "1d ago",
    content: md(`
---
tags: [bug, audio]
owner: Dmitri Volkov
---
# Audio dropout

Reproduced by [[Dmitri Volkov]] (HW-1182). Traces to the encode path. Needs an owner — routing to Dmitri since he owns the audio subsystem.
`) },

  /* Meetings */
  { id: "n-standup", type: "file", ext: "md", name: "2026-06-13 Standup.md", parentId: "f-meetings", updated: "today",
    content: md(`
---
tags: [meeting, standup]
attendees: [Priya Menon, Dmitri Volkov, Marcus Chen]
---
# Eng standup — 2026-06-13

Throughput, the rig throttling, and the codec date.

## Commitments
- [ ] Order thermal pads for the rigs — *me → [[Priya Menon]]*
- [ ] Share the latency benchmark with \`#platform\` — *me → [[Marcus Chen]]*
- [ ] Cut the rig firmware bump — *[[Dmitri Volkov]] → me*
- [ ] Confirm the codec date — *[[Marcus Chen]] → me*

## Decisions
- Perf numbers re-baseline once the rigs stop throttling.
`) },
  { id: "n-retro", type: "file", ext: "md", name: "Design retro.md", parentId: "f-meetings", updated: "1d ago",
    content: md(`
---
tags: [meeting, retro]
---
# Design retro

23 stickies → 3 themes: handoff timing, spec ambiguity, review load.

## Decisions
- Specs need an explicit *open questions* section before handoff.
- Reviews need only 2 of 3 reviewers to keep quorum.
`) },

  /* People */
  { id: "n-priya", type: "file", ext: "md", name: "Priya Menon.md", parentId: "f-people", updated: "5d ago",
    content: md(`
---
tags: [person, eng]
role: Eng Lead, Capture
---
# Priya Menon

Owns the **M-series test rigs** and the **capture pipeline**. Prefers async DMs over meetings.

Open with her: [[Thermal throttling]], [[Capture GA plan]].
`) },
  { id: "n-dmitri", type: "file", ext: "md", name: "Dmitri Volkov.md", parentId: "f-people", updated: "5d ago",
    content: md(`
---
tags: [person, platform]
role: Firmware
---
# Dmitri Volkov

Owns **rig firmware** and the **audio subsystem**. Holds the [[Audio dropout]] repro.
`) },
  { id: "n-marcus", type: "file", ext: "md", name: "Marcus Chen.md", parentId: "f-people", updated: "5d ago",
    content: md(`
---
tags: [person, platform]
role: Eng Lead, Codec
---
# Marcus Chen

Owns the **[[Codec decision]]** and the encode pipeline. The codec date is the current schedule risk.
`) },

  /* Decisions */
  { id: "n-codec", type: "file", ext: "md", name: "Codec decision.md", parentId: "f-decisions", updated: "2d ago",
    content: md(`
---
tags: [decision, codec, open]
owner: Marcus Chen
status: leaning
---
# Codec decision

**Leaning AV1**, pending [[Marcus Chen]]'s final call. Blocks [[Capture GA plan]].

\`\`\`text
AV1   — best quality/bitrate, slower encode, licensing clear
HEVC  — faster, licensing review needed (see Legal)
\`\`\`

> [!question] Can we ship the third-party codec? Routed to Legal — no answer yet.
`) },
  { id: "n-padstd", type: "file", ext: "md", name: "Thermal pad standard.md", parentId: "f-decisions", updated: "3h ago",
    content: md(`
---
tags: [decision, standard]
---
# Thermal pad standard

==We standardize on Arctic thermal pads.== Learned from a correction on the rig order — Steward remembers this across Moves. See [[Thermal throttling]].
`) },

  /* Daily */
  { id: "n-daily", type: "file", ext: "md", name: "2026-06-13.md", parentId: "f-daily", updated: "today",
    content: md(`
---
tags: [daily]
---
# 2026-06-13

- Capture pipeline went to a **fire** this morning — frames corrupting in prod.
- [[Thermal throttling]] order still needs Priya's qty.
- Push on the [[Codec decision]] before it sinks [[Capture GA plan]].
`) },
];

/* RAG / embeddings — local-first; an API provider can be swapped in. */
export const EMBEDDING_PROVIDERS = [
  { id: "openai", label: "OpenAI · text-embedding-3-large", dims: 3072, where: "API key", active: true },
  { id: "google", label: "Google · gemini-embedding-001", dims: 3072, where: "API key" },
  { id: "local",  label: "Local · nomic-embed-text", dims: 768, where: "localhost:11434 · Ollama" },
];
export const VAULT_INDEX = {
  notes: 13, chunks: 184, embedded: 184, provider: "OpenAI · text-embedding-3-large",
  db: "localhost:6333 · Qdrant", lastIndexed: "8m ago", status: "indexed",
};

export const FILE_KIND = {
  md:   { label: "Markdown", color: "var(--accent)" },
  pdf:  { label: "PDF",      color: "var(--red)" },
  xlsx: { label: "Sheet",    color: "var(--green)" },
  png:  { label: "Image",    color: "var(--amber)" },
};

/* ----------------------------- screen blurbs ----------------------------- */
/* The old per-screen sub-header text, now surfaced in the sidebar's collapsible
   Quick Info rather than as a hero subtitle. */
export const SCREEN_INFO = {
  desk: "What needs you now, ranked by severity × needle-impact. Confidence is a quality signal, not the priority. Nothing is sent or filed without your approval.",
  carrying: "Everything still open — what you're carrying across the days. Each loop has an owner, a counterparty, a state, and an age. The Log is only the part that's closed.",
  meetings: "Prep before, capture during, fan-out after. Commitments become tracked loops; decisions land in a log.",
  roadmap: "Steward doesn't own the plan — it notices when reality and the plan disagree, surfacing slips and broken dependencies as loops to reconcile.",
  vault: "Your Obsidian vault — read, edit, and organize notes, indexed for retrieval so Studio can ground its answers in it.",
  studio: "Work a problem with Steward in real time. The work becomes a Move as you go — every send or file step waits for your approval.",
  sources: "What Steward listens to, over MCP. It only reads and reasons — every outbound or write step is approval-gated inside the Move.",
  log: "Closed loops — the part of what you were carrying that has resolved. Each keeps its full trace.",
  settings: "Providers, keys, and app preferences.",
};

/* ----------------------------- notifications ----------------------------- */
/* Replaces the inline reactive banner: fires and other alerts collect in a
   top-corner notification center (and, in the native shell, fire a real macOS
   notification). Each points back at the loop/Move it concerns. */
export const NOTIF_KIND = {
  fire:  { label: "Fire",   color: "var(--red)"    },
  slip:  { label: "Slip",   color: "var(--amber)"  },
  nudge: { label: "Nudge",  color: "var(--amber)"  },
  reply: { label: "Reply",  color: "var(--green)"  },
};

export const SEED_NOTIFICATIONS = [
  { id: "nt-fire", kind: "fire", severity: 92, loopId: "lp-fire", when: "2m ago", read: false,
    title: "Capture pipeline is corrupting frames",
    body: "3 of 8 rigs and widening — the corrupted frames are reaching the perf dataset for Monday's board deck." },
  { id: "nt-codec", kind: "slip", severity: 78, loopId: "lp-codec", when: "3h ago", read: false,
    title: "Codec decision slipped — Q3 GA at risk",
    body: "Marcus signalled early July. Steward drafted a plan reconciliation." },
  { id: "nt-budget", kind: "nudge", severity: 70, loopId: "lp-budget", when: "1h ago", read: false,
    title: "Budget ask is overdue with Finance",
    body: "6 days, past your 3-day SLA. Steward assembled the numbers and a re-pitch." },
  { id: "nt-firmware", kind: "reply", severity: 42, loopId: "lp-firmware", when: "Yesterday", read: true,
    title: "Dmitri replied on the firmware bump",
    body: "“this week” — the thermal mitigation is unblocked." },
];
