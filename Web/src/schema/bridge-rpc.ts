import type { BaseObject, ObjectId, ScopeConfig } from "./base";

/* ============================================================================
 * bridge-rpc.ts — the contract between the React UI and the native side.
 *
 * Today's bridge (Web/src/bridge.ts) carries only navigate/theme/insets. This
 * defines the two channels everything else needs:
 *
 *   1. RPC      JS calls a BridgeApi method, awaits a typed result.
 *   2. Events   Swift pushes a BridgeEvent into the page (alerts, streaming).
 *
 * Typed against the Object schema, so both sides share one source of truth.
 * The methods are grouped by surface; each maps to a local service from the UI
 * spec (vault FS, index/search, embeddings, LLM/agent, connectors, store).
 * ========================================================================== */

/* ---- transport envelopes ----------------------------------------------- */

export interface RpcCall<M extends keyof BridgeApi> {
  id: string; // correlation id; the result echoes it
  method: M;
  params: Parameters<BridgeApi[M]>[0];
}
export interface RpcResult<M extends keyof BridgeApi> {
  id: string;
  ok: boolean;
  result?: Awaited<ReturnType<BridgeApi[M]>>;
  error?: { code: string; message: string };
}

/* ---- shared shapes ----------------------------------------------------- */

export interface FileNode {
  path: string;
  name: string;
  kind: "folder" | "file";
  ext?: string;
  children?: FileNode[];
}

export interface ObjectQuery {
  type?: string; // a type or any of its subtypes (lineage-aware on the native side)
  clusterId?: ObjectId;
  text?: string;
  limit?: number;
}

export type SearchResultObject = BaseObject; // type === "search.result"
export type MoveObject = BaseObject; // type === "move"
export type ClusterObject = BaseObject; // type === "cluster" | "cluster.artifact"
export type LoopObject = BaseObject; // type === "loop"
export type AlertObject = BaseObject; // type === "alert"
export type SourceObject = BaseObject; // type === "source"

export type GateAction = "accept" | "adjust" | "approve" | "hold" | "simulate-reply";

/* ---- the API the native side implements -------------------------------- */

export interface BridgeApi {
  /* objects: the generic CRUD over any primitive */
  "objects.get": (p: { id: ObjectId }) => Promise<BaseObject | null>;
  "objects.put": (p: { object: BaseObject }) => Promise<BaseObject>; // validates, persists, (re)indexes
  "objects.delete": (p: { id: ObjectId }) => Promise<{ deleted: boolean }>;
  "objects.query": (p: ObjectQuery) => Promise<BaseObject[]>;

  /* vault: live Obsidian directory. Notes are pointer-storage; writes hit the .md */
  "vault.tree": (p: { root?: string }) => Promise<FileNode[]>;
  "vault.readNote": (p: { path: string }) => Promise<{ object: BaseObject; markdown: string }>;
  "vault.writeNote": (p: { path: string; markdown: string }) => Promise<BaseObject>; // writes .md, re-derives metadata
  "vault.move": (p: { from: string; to: string }) => Promise<{ ok: boolean }>;
  "vault.rename": (p: { path: string; name: string }) => Promise<{ ok: boolean }>;
  "vault.createFolder": (p: { path: string }) => Promise<{ ok: boolean }>;
  "vault.delete": (p: { path: string }) => Promise<{ ok: boolean }>;

  /* search + retrieval: one hybrid path, two callers (user UI and model) */
  "search.hybrid": (p: { query: string; scope?: ScopeConfig; k?: number }) => Promise<SearchResultObject[]>;
  "search.retrieve": (p: { query: string; scope?: ScopeConfig; k?: number }) => Promise<{
    chunks: Array<{ text: string; sourceId: ObjectId; score: number }>;
  }>;

  /* index + embeddings */
  "index.reindex": (p: { sourceId?: ObjectId; objectId?: ObjectId }) => Promise<{ jobId: string }>;
  "index.status": (p: { sourceId?: ObjectId }) => Promise<{ status: string; done: number; total: number }>;
  "embeddings.setProvider": (p: { provider: "local" | "openai" | "google"; model: string }) => Promise<{ ok: boolean }>;

  /* moves: the spine + correct-and-recompute + gated execution */
  "moves.propose": (p: { loopId?: ObjectId; seed?: ObjectId }) => Promise<MoveObject>;
  "moves.act": (p: { moveId: ObjectId; nodeId: string; action: GateAction; feedback?: string }) => Promise<MoveObject>;
  "moves.execute": (p: { moveId: ObjectId }) => Promise<{ move: MoveObject; exit: BaseObject }>;

  /* clusters: the home board + auto-clustering + artifacts */
  "clusters.list": () => Promise<ClusterObject[]>;
  "clusters.create": (p: { members: ObjectId[]; kind?: string; title?: string }) => Promise<ClusterObject>;
  "clusters.autocluster": () => Promise<ClusterObject[]>; // a structuring pass; returns proposals (confidence-gated)
  "clusters.setMembers": (p: { clusterId: ObjectId; add?: ObjectId[]; remove?: ObjectId[] }) => Promise<ClusterObject>;
  "clusters.artifacts": (p: { clusterId: ObjectId }) => Promise<ClusterObject[]>;

  /* loops: Carrying */
  "loops.list": (p: { clusterId?: ObjectId; segment?: "all" | "needs-you" | "waiting" | "fires" }) => Promise<LoopObject[]>;
  "loops.setState": (p: { loopId: ObjectId; state: string }) => Promise<LoopObject>;

  /* alerts: raised by the model tool OR auto-emitted on `fire` tagging */
  "alerts.raise": (p: { target: ObjectId; severity: "info" | "warn" | "fire"; headline: string; context?: string; trigger: "model" | "auto" }) => Promise<AlertObject>;
  "alerts.snooze": (p: { alertId: ObjectId; until: string }) => Promise<AlertObject>;
  "alerts.list": () => Promise<AlertObject[]>;

  /* ai sessions: scoped chat. Streaming arrives via events, not the return. */
  "ai.start": (p: { scope?: ScopeConfig }) => Promise<{ sessionId: ObjectId }>;
  "ai.send": (p: { sessionId: ObjectId; message: string; pinned?: ObjectId[] }) => Promise<{ accepted: boolean }>;

  /* connectors / sources */
  "sources.list": () => Promise<SourceObject[]>;
  "sources.reconnect": (p: { sourceId: ObjectId }) => Promise<{ ok: boolean }>;
  "sources.sweep": (p: { sourceId: ObjectId }) => Promise<{ jobId: string }>;
}

/* ---- the events the native side pushes (Swift -> JS) -------------------- */

export interface BridgeEvents {
  /** The Reactive banner. Same shape whether model-raised or auto-emitted. */
  alert: AlertObject;
  /** Streaming chat tokens for an ai.session. */
  "chat.token": { sessionId: ObjectId; token: string };
  "chat.done": { sessionId: ObjectId; session: BaseObject };
  /** Reindex / embedding progress for the Sources + Vault status UI. */
  "index.progress": { sourceId?: ObjectId; done: number; total: number; status: string };
  /** Obsidian (or anything) changed a vault file underneath us. */
  "vault.changed": { path: string; kind: "created" | "modified" | "deleted" };
  /** A loop changed state (Carrying live-updates). */
  "loop.updated": LoopObject;
  /** Connector sweep heartbeat (the sidebar "listening / swept" status). */
  "sweep.status": { sourceId: ObjectId; status: string; at: string };
}

export type BridgeEventName = keyof BridgeEvents;
export interface BridgeEvent<E extends BridgeEventName = BridgeEventName> {
  event: E;
  payload: BridgeEvents[E];
}
