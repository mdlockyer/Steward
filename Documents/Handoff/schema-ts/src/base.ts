import { z } from "zod";

/* ============================================================================
 * base.ts — the primitives every Object in Steward shares.
 *
 * One Object type underlies everything: a Move, an Obsidian note, a Slack
 * message, a RAG result, a person, an AI session. They differ only in `type`,
 * `extends` (their lineage), and `body` (their type-specific payload). Identity
 * is `extends`; composition is `refs: contains`; the graph is `refs: relates`.
 * ========================================================================== */

/** Stable id. Convention: `<prefix>_<base36>` e.g. mv_7f3a, nt_9a21, cl_001. */
export const objectId = z
  .string()
  .regex(/^[a-z][a-z0-9]*_[a-z0-9]+$/i, "id must look like `prefix_suffix`");
export type ObjectId = z.infer<typeof objectId>;

/** An Object's participation role *inside a Move spine* — not a global label. */
export const role = z.enum(["enter", "middle", "exit"]);
export type Role = z.infer<typeof role>;

/** Edge kinds. `contains` = composition; `relates` = typed association. */
export const refKind = z.enum(["contains", "relates"]);

/** Predicates for `relates` edges. Extend as the platform grows. */
export const assocPredicate = z.enum([
  "about",
  "blocks",
  "produced-from",
  "owns",
  "mentions",
  "derived-from",
  "duplicates",
  "supersedes",
  "explains",
]);
export type AssocPredicate = z.infer<typeof assocPredicate>;

/** A directed edge from this Object to another Object. */
export const ref = z
  .object({
    rel: refKind,
    to: objectId,
    /** Required for `relates`; ignored for `contains`. */
    predicate: assocPredicate.optional(),
    /** Which named slot this fill targets (used by `contains` acceptance). */
    slot: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((r) => (r.rel === "relates" ? !!r.predicate : true), {
    message: "`relates` edges require a predicate",
  });
export type Ref = z.infer<typeof ref>;

/** Where an Object came from. `external: true` means an outbound/3rd-party origin. */
export const provenance = z.object({
  source: z.string(), // "obsidian" | "slack" | "jira" | "user" | "model" | ...
  uri: z.string().optional(),
  author: z.string().optional(),
  ingestedAt: z.string().datetime().optional(),
  external: z.boolean().default(false),
});

/** Index/embedding state. Present on every Object; most get embedded. */
export const indexInfo = z.object({
  embedded: z.boolean().default(false),
  embeddingModel: z.string().optional(), // "local:bge-m3" | "openai:text-embedding-3-large" | ...
  chunks: z
    .array(z.object({ id: z.string(), ord: z.number().int(), tokens: z.number().int().optional() }))
    .default([]),
  keywordIndexed: z.boolean().default(false),
  staleAt: z.string().datetime().optional(),
});

/* ---- shared sub-schemas used by several types -------------------------- */

/** The single knob that governs cluster scoping for AI sessions and search. */
export const scopeConfig = z.object({
  clusterId: objectId.optional(),
  /** Multiplier applied to in-scope results during ranking. */
  boostInScope: z.number().default(2.0),
  /** May retrieval/chat see Objects outside the cluster at all? */
  allowGlobal: z.boolean().default(true),
  /** If true, never leave the cluster (overrides allowGlobal). */
  hardScope: z.boolean().default(false),
});
export type ScopeConfig = z.infer<typeof scopeConfig>;

/** Approval gate on an outbound/write step of a Move. */
export const gateSpec = z.object({
  kind: z.enum(["none", "send", "write"]).default("none"),
  audienceStakes: z.enum(["low", "peer", "high"]).default("peer"),
  approved: z.boolean().default(false),
});

/** One node on a Move's linear spine. `contains` pulls in *any* Object. */
export const spineNode = z.object({
  node: z.enum([
    "observe",
    "connect",
    "retrieve",
    "draft",
    "send",
    "await",
    "create",
    "delegate",
    "escalate",
    "reconcile",
    "pitch",
  ]),
  role, // enter | middle | exit — authoritative here, not on the Object
  title: z.string(),
  body: z.string().optional(),
  /** Objects pulled into this node (a Slack message, a file, a search hit). */
  contains: z.array(objectId).default([]),
  /** Exit nodes only: the Object this step creates (the ticket, the message). */
  produces: objectId.optional(),
  gate: gateSpec.optional(),
  status: z
    .enum(["pending", "edge", "settled", "gate", "await", "recomputing", "done", "invalid"])
    .default("pending"),
  confidence: z.number().min(0).max(1).optional(),
});
export type SpineNode = z.infer<typeof spineNode>;

/* ---- the base object --------------------------------------------------- */

export const baseObject = z.object({
  id: objectId,
  type: z.string(), // refined to a literal per registered type
  /** Denormalized lineage [self, ..., "object"]. May be omitted in authored
   *  files; the validator derives and fills it from the registry. */
  extends: z.array(z.string()).optional(),
  title: z.string(),
  body: z.unknown(), // refined per type
  refs: z.array(ref).default([]),
  provenance,
  index: indexInfo.default({ embedded: false, chunks: [], keywordIndexed: false }),
  /** Where the content of truth lives. `inline` = this object's `body` is
   *  canonical (Moves, Clusters, indexed messages). `pointer` = `body.path`
   *  points to a canonical external file in its NATIVE format (Obsidian
   *  markdown, pdf, xlsx); `body.raw` is a derived extraction only, never the
   *  source. Vault-backed documents default to `pointer` (see validate.ts). */
  storage: z.enum(["inline", "pointer"]).optional(),
  /** Cache only. The authoritative role lives on the Move spine edge. */
  dominantRole: role.nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  meta: z.record(z.unknown()).default({}),
});
export type BaseObject = z.infer<typeof baseObject>;
