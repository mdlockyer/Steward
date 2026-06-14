/* ============================================================================
   Steward — mock "world" the agent reasons over. ALL DATA IS SAMPLE.
   The real model calls the tools in agent.js; those tools read/write THIS
   file's in-memory data. So the reasoning is real, the data and side effects
   are simulated — consistent with the rest of the Steward demo.
   ========================================================================== */

/* A tiny keyword-addressable corpus per source. read_source matches loosely so
   a real model gets useful, specific results for the demo narrative and a
   graceful "nothing strong" for off-topic queries. */
const CORPUS = {
  granola: [
    { tags: ["standup", "rig", "throttle", "thermal", "perf", "m-series"],
      text: "Standup (today): Priya (Eng) said the M-series test rigs are thermal-throttling on long capture runs, which is skewing the perf numbers the team reports.",
      ref: "Granola · standup notes" },
    { tags: ["1:1", "roadmap"],
      text: "1:1 notes (Tue): roadmap is stable; no blockers raised.",
      ref: "Granola · 1:1" },
  ],
  slack: [
    { tags: ["throttle", "thermal", "rig", "hw-platform", "dmitri", "pad"],
      text: "#hw-platform (3 weeks ago) — Dmitri: same throttling on a different rig. Thread concluded a higher-conductivity thermal pad fixed it. Never formally resolved.",
      ref: "Slack · #hw-platform" },
    { tags: ["codec", "license", "legal", "product", "sam"],
      text: "#product — Sam: \"are we even allowed to ship the third-party codec?\" Thread moved on with no answer.",
      ref: "Slack · #product" },
  ],
  jira: [
    { tags: ["throttle", "thermal", "rig", "open"],
      text: "No open HW-OPS ticket currently tracks the rig throttling.",
      ref: "Jira · HW-OPS" },
  ],
  outlook: [
    { tags: ["demo", "marketing", "capture"],
      text: "Marketing asked for a 30-min capture-pipeline demo slot this week; thread went quiet.",
      ref: "Outlook · flagged mail" },
  ],
};

function score(item, q) {
  const ql = (q || "").toLowerCase();
  return item.tags.reduce((s, t) => (ql.includes(t) ? s + 1 : s), 0);
}

export function readSource({ source, query }) {
  const key = String(source || "").toLowerCase();
  const bucket = CORPUS[key];
  if (!bucket) {
    return { found: false, note: `No source named "${source}". Known: ${Object.keys(CORPUS).join(", ")}.` };
  }
  const ranked = [...bucket].map((i) => ({ i, s: score(i, query) })).sort((a, b) => b.s - a.s);
  const top = ranked[0];
  if (!top || top.s === 0) {
    return { found: false, source: key, note: `Read ${key}, nothing strongly matching "${query}".` };
  }
  return { found: true, source: key, ref: top.i.ref, text: top.i.text };
}

/* connect — surface a related open thread for a topic */
export function findRelated({ topic }) {
  const t = (topic || "").toLowerCase();
  if (/throttl|thermal|rig|pad|perf/.test(t)) {
    return {
      found: true,
      related: "Dmitri's #hw-platform thread from ~3 weeks ago describes the same throttling. Its conclusion: a higher-conductivity thermal pad fixed it. That thread was never resolved.",
      ref: "Slack · #hw-platform",
    };
  }
  return { found: false, note: `No clearly related open thread for "${topic}".` };
}

/* retrieve — find purchasable parts that match a spec */
export function findParts({ spec, vendor }) {
  const v = (vendor || "").toLowerCase();
  const all = [
    { name: "Gelid GP-Extreme", spec: "1.5 mm · 12 W/mK", price: "$14", vendor: "Amazon" },
    { name: "Thermalright Odyssey", spec: "2.0 mm · 12.8 W/mK", price: "$11", vendor: "Amazon" },
    { name: "Arctic TP-3", spec: "2.0 mm · 12.5 W/mK", price: "$16", vendor: "Amazon" },
    { name: "Arctic TP-3", spec: "1.5 mm · 12.5 W/mK", price: "$13", vendor: "Amazon" },
  ];
  let parts = all;
  if (v) parts = parts.filter((p) => p.name.toLowerCase().includes(v));
  if (/2\.0|2 ?mm/.test(spec || "")) parts = parts.filter((p) => p.spec.includes("2.0"));
  if (!parts.length) parts = all.slice(0, 2);
  return { found: true, parts: parts.slice(0, 2), query: { spec: spec || null, vendor: vendor || null } };
}

/* await — (mock) the reply that comes back after a sent message */
export function awaitReply({ to }) {
  return {
    replied: true,
    from: to || "Priya Menon",
    text: "👍 go with the 2.0 mm Arctic, order 6 of them.",
  };
}

/* ---- WRITE tools: these are the side-effecting actions. They are NEVER run
   without explicit user approval (the agent loop gates them). On approval they
   mutate this mock ledger and return a receipt. ---- */
let TICKET_SEQ = 1190;
export const LEDGER = { sent: [], created: [] };

export function draftAndSend({ to, channel, message }) {
  const receipt = { to: to || channel || "recipient", channel: channel || "DM", message, at: "just now" };
  LEDGER.sent.push(receipt);
  return { sent: true, ...receipt };
}

export function createArtifact({ system, type, summary, fields }) {
  const id = system && /jira/i.test(system) ? `HW-${TICKET_SEQ++}` : `${(system || "DOC").toUpperCase()}-${TICKET_SEQ++}`;
  const receipt = { id, system: system || "Jira", type: type || "Task", summary, fields: fields || null };
  LEDGER.created.push(receipt);
  return { created: true, ...receipt };
}
