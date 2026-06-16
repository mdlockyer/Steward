import Foundation

// =============================================================================
// BridgeRPC.swift — the native side of the bridge contract.
//
// The authoritative contract is bridge-rpc.ts (typechecked). This is the Swift
// mirror: the envelopes the WKWebView message handler decodes, the method and
// event names, and the service protocol the app implements. Bodies stay generic
// (JSONValue) at this layer; each handler decodes its own params/result struct.
//
// Wire it to the existing WebBridge: today JS posts only {type:"ready"}. Add a
// second message type {type:"rpc", call: RpcCall} and reply by evaluating
// `window.__steward.resolve(id, result)`; push events via
// `window.__steward.emit(event, payload)`.
// =============================================================================

public struct RpcCall: Codable, Sendable {
    public let id: String
    public let method: String
    public let params: JSONValue
}

public struct RpcResult: Codable, Sendable {
    public let id: String
    public let ok: Bool
    public var result: JSONValue?
    public var error: RpcError?
}

public struct RpcError: Codable, Sendable {
    public let code: String
    public let message: String
}

/// Names mirror bridge-rpc.ts `BridgeApi`. Kept as a flat namespace of strings
/// so the dispatcher can switch on them.
public enum BridgeMethod: String, Sendable {
    case objectsGet = "objects.get"
    case objectsPut = "objects.put"
    case objectsDelete = "objects.delete"
    case objectsQuery = "objects.query"
    case vaultTree = "vault.tree"
    case vaultReadNote = "vault.readNote"
    case vaultWriteNote = "vault.writeNote"
    case vaultMove = "vault.move"
    case vaultRename = "vault.rename"
    case vaultCreateFolder = "vault.createFolder"
    case vaultDelete = "vault.delete"
    case searchHybrid = "search.hybrid"
    case searchRetrieve = "search.retrieve"
    case indexReindex = "index.reindex"
    case indexStatus = "index.status"
    case embeddingsSetProvider = "embeddings.setProvider"
    case movesPropose = "moves.propose"
    case movesAct = "moves.act"
    case movesExecute = "moves.execute"
    case clustersList = "clusters.list"
    case clustersCreate = "clusters.create"
    case clustersAutocluster = "clusters.autocluster"
    case clustersSetMembers = "clusters.setMembers"
    case clustersArtifacts = "clusters.artifacts"
    case loopsList = "loops.list"
    case loopsSetState = "loops.setState"
    case alertsRaise = "alerts.raise"
    case alertsSnooze = "alerts.snooze"
    case alertsList = "alerts.list"
    case aiStart = "ai.start"
    case aiSend = "ai.send"
    case sourcesList = "sources.list"
    case sourcesReconnect = "sources.reconnect"
    case sourcesSweep = "sources.sweep"
}

/// Push events (Swift -> JS). Mirrors bridge-rpc.ts `BridgeEvents`.
public enum BridgeEvent: Sendable {
    case alert(StewardObject)
    case chatToken(sessionId: String, token: String)
    case chatDone(sessionId: String, session: StewardObject)
    case indexProgress(sourceId: String?, done: Int, total: Int, status: String)
    case vaultChanged(path: String, kind: String) // created | modified | deleted
    case loopUpdated(StewardObject)
    case sweepStatus(sourceId: String, status: String, at: String)

    public var name: String {
        switch self {
        case .alert: return "alert"
        case .chatToken: return "chat.token"
        case .chatDone: return "chat.done"
        case .indexProgress: return "index.progress"
        case .vaultChanged: return "vault.changed"
        case .loopUpdated: return "loop.updated"
        case .sweepStatus: return "sweep.status"
        }
    }
}

/// What the app implements. One actor backs the store; vault/index/embeddings/
/// LLM/connectors are services it calls. Representative methods only; the full
/// surface is in bridge-rpc.ts.
public protocol BridgeService: Sendable {
    func objectsGet(id: String) async throws -> StewardObject?
    func objectsPut(_ object: StewardObject) async throws -> StewardObject
    func objectsQuery(type: String?, clusterId: String?, text: String?, limit: Int?) async throws -> [StewardObject]

    func vaultTree(root: String?) async throws -> JSONValue
    func vaultReadNote(path: String) async throws -> (object: StewardObject, markdown: String)
    func vaultWriteNote(path: String, markdown: String) async throws -> StewardObject

    func searchHybrid(query: String, scope: JSONValue?, k: Int?) async throws -> [StewardObject]

    func movesAct(moveId: String, nodeId: String, action: String, feedback: String?) async throws -> StewardObject
    func movesExecute(moveId: String) async throws -> (move: StewardObject, exit: StewardObject)

    func alertsRaise(target: String, severity: String, headline: String, context: String?, trigger: String) async throws -> StewardObject

    /// Subscribe to push events; the implementation calls back on the main actor
    /// to evaluate `window.__steward.emit(...)` in the WKWebView.
    func subscribe(_ onEvent: @escaping @Sendable (BridgeEvent) -> Void)
}
