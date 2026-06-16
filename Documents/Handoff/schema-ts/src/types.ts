import { z } from "zod";
import { objectId, scopeConfig, spineNode } from "./base";
import { registry, type TypeDef } from "./registry";

/* ============================================================================
 * types.ts — the registered hierarchy.
 *
 *   object
 *   ├── document
 *   │   ├── note            (Obsidian markdown)
 *   │   └── file            (arbitrary: pdf, xlsx, image, ...)
 *   ├── message
 *   │   ├── slack.message
 *   │   └── email.message
 *   ├── person
 *   ├── cluster
 *   │   └── cluster.artifact
 *   ├── move
 *   ├── move.trace
 *   ├── ai.session
 *   ├── search.result
 *   ├── loop
 *   ├── alert
 *   ├── source
 *   └── decision
 *
 * Body composition mirrors type inheritance: noteBody extends documentBody,
 * slackBody extends messageBody, artifactClusterBody extends clusterBody.
 * ========================================================================== */

const def = (d: TypeDef) => registry.register(d);

/* ---- root -------------------------------------------------------------- */
const objectBody = z.record(z.unknown());
def({ type: "object", parent: null, bodySchema: objectBody, description: "Root. Rarely instantiated directly." });

/* ---- documents --------------------------------------------------------- */
const documentBody = z.object({
  path: z.string().optional(), // on-disk path for vault-native files
  mime: z.string(),
  raw: z.string().optional(), // extracted text (always), or markdown source
  bytes: z.number().int().optional(),
});
def({ type: "document", parent: "object", bodySchema: documentBody });

const noteBody = documentBody.extend({
  frontmatter: z.record(z.unknown()).default({}),
  wikilinks: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  backlinks: z.array(objectId).default([]),
  status: z.string().optional(), // e.g. "leaning", "@Marcus Chen"
});
def({ type: "note", parent: "document", bodySchema: noteBody, description: "Obsidian markdown file, live on disk." });

const fileBody = documentBody.extend({
  kind: z.enum(["pdf", "spreadsheet", "image", "audio", "video", "other"]).default("other"),
});
def({ type: "file", parent: "document", bodySchema: fileBody, description: "Arbitrary file; text extracted for search." });

/* ---- messages ---------------------------------------------------------- */
const messageBody = z.object({
  author: z.string(),
  text: z.string(),
  ts: z.string().datetime().optional(),
  threadId: z.string().optional(),
  channel: z.string().optional(),
});
def({ type: "message", parent: "object", bodySchema: messageBody });

const slackBody = messageBody.extend({
  workspace: z.string().optional(),
  permalink: z.string().optional(),
  reactions: z.array(z.string()).default([]),
});
def({ type: "slack.message", parent: "message", bodySchema: slackBody });

const emailBody = messageBody.extend({
  subject: z.string().optional(),
  from: z.string(),
  to: z.array(z.string()).default([]),
});
def({ type: "email.message", parent: "message", bodySchema: emailBody });

/* ---- people ------------------------------------------------------------ */
const personBody = z.object({
  name: z.string(),
  title: z.string().optional(),
  handles: z.record(z.string()).default({}), // { slack: "U123", email: "p@x.com" }
  reportsTo: objectId.optional(),
  escalateTo: objectId.optional(),
});
def({
  type: "person",
  parent: "object",
  bodySchema: personBody,
  relations: { owns: { accepts: "object", many: true } },
  description: "Org-model node. Powers delegation and audience-aware stakes.",
});

/* ---- clusters ---------------------------------------------------------- */
const clusterBody = z.object({
  kind: z.enum(["project", "team", "workgroup", "social", "ad-hoc"]).default("project"),
  scope: scopeConfig.default({}),
  auto: z.boolean().default(false), // model-generated vs hand-assembled
  confidence: z.number().min(0).max(1).optional(), // for auto clusters
  summary: z.string().optional(),
});
def({
  type: "cluster",
  parent: "object",
  bodySchema: clusterBody,
  slots: { member: { accepts: "object", many: true } }, // a Cluster holds ANY Object
  description: "The container and the home board. Members are refs:contains slot=member.",
});

const artifactClusterBody = clusterBody.extend({
  producedBy: objectId.optional(), // the move/ai.session that generated it
});
def({
  type: "cluster.artifact",
  parent: "cluster",
  bodySchema: artifactClusterBody,
  slots: { member: { accepts: "object", many: true } },
  relations: { "produced-from": { accepts: "cluster" } }, // must derive from a cluster
  description: "A cluster produced from a cluster (artifacts area of a board).",
});

/* ---- moves ------------------------------------------------------------- */
const moveBody = z.object({
  moveType: z.enum(["errand", "delegate", "escalate", "prep", "reconcile", "pitch"]),
  status: z.enum(["proposed", "active", "blocked", "executed", "dismissed"]).default("proposed"),
  spine: z.array(spineNode).min(1),
  confidence: z.number().min(0).max(1).optional(),
  loopId: objectId.optional(), // the loop this Move acts on
});
def({
  type: "move",
  parent: "object",
  bodySchema: moveBody,
  slots: { step: { accepts: "object", many: true } }, // spine nodes contain ANY Object
  description: "A reasoned causal chain. Inspected as a spine with gates.",
});

/* ---- move trace (the learning loop) ------------------------------------ */
const moveTraceBody = z.object({
  exit: objectId, // the real outcome (a filed ticket, a sent message)
  reconstructed: z.object({
    enter: objectId.optional(),
    middle: z.array(objectId).default([]),
    moveType: z.enum(["errand", "delegate", "escalate", "prep", "reconcile", "pitch"]).optional(),
  }),
  evidence: z.array(objectId).default([]),
  confidence: z.number().min(0).max(1),
  explanation: z.string().optional(),
  reviewed: z.boolean().default(false), // user-corrected → stronger signal
});
def({
  type: "move.trace",
  parent: "object",
  bodySchema: moveTraceBody,
  relations: { explains: { accepts: "object" } }, // points at the exit it explains
  description: "Overnight back-trace of an exit Object to the Move that produced it.",
});

/* ---- ai session -------------------------------------------------------- */
const aiSessionBody = z.object({
  scope: scopeConfig.default({}),
  model: z.string().optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant", "tool"]), content: z.string() }))
    .default([]),
  pinned: z.array(objectId).default([]), // objects dropped in as context
});
def({
  type: "ai.session",
  parent: "object",
  bodySchema: aiSessionBody,
  slots: { context: { accepts: "object", many: true } },
  description: "A scoped chat. Treated like a provider 'project' but with the scope knob.",
});

/* ---- search result ----------------------------------------------------- */
const searchResultBody = z.object({
  query: z.string(),
  sourceRef: objectId, // the Object this result points at
  score: z.number(),
  vectorScore: z.number().optional(),
  keywordScore: z.number().optional(),
  matchedChunk: z.string().optional(),
});
def({
  type: "search.result",
  parent: "object",
  bodySchema: searchResultBody,
  relations: { "derived-from": { accepts: "object" } },
  description: "Ephemeral. A hybrid-search hit; same base structure as everything else.",
});

/* ---- ops primitives (carried from the prior spec) ---------------------- */
const loopBody = z.object({
  state: z.enum(["open", "in-flight", "waiting", "at-risk", "escalated", "scheduled", "closed"]),
  category: z.enum(["commitment", "ask", "fire", "roadmap-risk", "budget", "waiting-on"]),
  owner: objectId.optional(),
  counterparty: objectId.optional(),
  ageStart: z.string().datetime(),
  nudgeAt: z.string().datetime().optional(),
  readyMoveType: z.enum(["errand", "delegate", "escalate", "prep", "reconcile", "pitch"]).optional(),
});
def({ type: "loop", parent: "object", bodySchema: loopBody, description: "An open thread of work. Carrying is loops; Log is closed loops." });

const alertBody = z.object({
  severity: z.enum(["info", "warn", "fire"]),
  headline: z.string(),
  context: z.string().optional(),
  target: objectId, // a move or a loop
  trigger: z.enum(["model", "auto"]),
  startedAt: z.string().datetime(),
  snoozedUntil: z.string().datetime().optional(),
});
def({ type: "alert", parent: "object", bodySchema: alertBody, description: "Raised by the model tool or auto-emitted on `fire` tagging." });

const sourceBody = z.object({
  provider: z.string(),
  connection: z.enum(["ok", "reauth", "error"]),
  freshness: z.string().optional(),
  signalCount: z.number().int().default(0),
  indexStatus: z.enum(["indexed", "indexing", "stale", "error"]).default("indexed"),
  embeddingProvider: z.string().optional(),
});
def({ type: "source", parent: "object", bodySchema: sourceBody, description: "A data provider over MCP or local; ingests and embeds." });

const decisionBody = z.object({
  status: z.enum(["leaning", "decided", "blocked"]),
  owner: objectId.optional(),
  summary: z.string(),
});
def({
  type: "decision",
  parent: "object",
  bodySchema: decisionBody,
  relations: { blocks: { accepts: "object", many: true } },
  description: "A recorded call. Lives in the vault, surfaced from meetings/reconcile.",
});
