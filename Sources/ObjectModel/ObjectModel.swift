import Foundation

// =============================================================================
// ObjectModel.swift — the Swift side of the Steward object model.
//
// Mirrors the TypeScript schema (base.ts / registry.ts / types.ts). The native
// index must enforce the SAME hierarchy the web side authors against, so this
// is the registry + the one acceptance rule + Codable models for the store.
//
// NOTE: written to mirror the verified TS exactly; typecheck with
//   swiftc -typecheck ObjectModel.swift main.swift
// Swift 6, strict-concurrency clean (all types are immutable value types).
// =============================================================================

// MARK: - JSONValue (type-agnostic `body`, mirrors TS `body: unknown`)

public enum JSONValue: Codable, Sendable, Equatable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    public init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null; return }
        if let b = try? c.decode(Bool.self) { self = .bool(b); return }
        if let d = try? c.decode(Double.self) { self = .number(d); return }
        if let s = try? c.decode(String.self) { self = .string(s); return }
        if let a = try? c.decode([JSONValue].self) { self = .array(a); return }
        if let o = try? c.decode([String: JSONValue].self) { self = .object(o); return }
        throw DecodingError.dataCorruptedError(in: c, debugDescription: "unsupported JSON value")
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .null: try c.encodeNil()
        case .bool(let b): try c.encode(b)
        case .number(let n): try c.encode(n)
        case .string(let s): try c.encode(s)
        case .array(let a): try c.encode(a)
        case .object(let o): try c.encode(o)
        }
    }

    public subscript(_ key: String) -> JSONValue? {
        if case .object(let o) = self { return o[key] }
        return nil
    }
    public var stringValue: String? {
        if case .string(let s) = self { return s }
        return nil
    }
}

// MARK: - Enums

public enum Role: String, Codable, Sendable { case enter, middle, exit }
public enum Storage: String, Codable, Sendable { case inline, pointer }
public enum RefKind: String, Codable, Sendable { case contains, relates }

public enum AssocPredicate: String, Codable, Sendable {
    case about, blocks, owns, mentions, duplicates, supersedes, explains
    case producedFrom = "produced-from"
    case derivedFrom = "derived-from"
}

// MARK: - Sub-structs

public struct Ref: Codable, Sendable, Equatable {
    public var rel: RefKind
    public var to: String
    public var predicate: AssocPredicate?
    public var slot: String?
    public var note: String?
}

public struct Provenance: Codable, Sendable, Equatable {
    public var source: String
    public var uri: String?
    public var author: String?
    public var ingestedAt: String?
    public var external: Bool?
}

public struct ChunkRef: Codable, Sendable, Equatable {
    public var id: String
    public var ord: Int
    public var tokens: Int?
}

public struct IndexInfo: Codable, Sendable, Equatable {
    public var embedded: Bool?
    public var embeddingModel: String?
    public var chunks: [ChunkRef]?
    public var keywordIndexed: Bool?
    public var staleAt: String?
}

// MARK: - The base Object

public struct StewardObject: Codable, Sendable {
    public var id: String
    public var type: String
    public var ext: [String]?            // `extends`; renamed (reserved word) via CodingKeys
    public var title: String
    public var body: JSONValue
    public var refs: [Ref]?
    public var provenance: Provenance
    public var index: IndexInfo?
    public var storage: Storage?
    public var dominantRole: Role?
    public var createdAt: String
    public var updatedAt: String
    public var meta: JSONValue?

    enum CodingKeys: String, CodingKey {
        case id, type
        case ext = "extends"
        case title, body, refs, provenance, index, storage, dominantRole, createdAt, updatedAt, meta
    }
}

// MARK: - Type registry

public struct SlotDef: Sendable, Equatable {
    public let accepts: String
    public var many: Bool = false
    public var required: Bool = false
}

public struct TypeDef: Sendable {
    public let type: String
    public let parent: String?
    public var slots: [String: SlotDef] = [:]
    public var relations: [String: SlotDef] = [:]
    public var description: String = ""
}

/// Immutable after construction, so it is trivially Sendable and lock-free.
public struct TypeRegistry: Sendable {
    private let defs: [String: TypeDef]
    private let lineages: [String: [String]]

    public init(_ definitions: [TypeDef]) {
        var map: [String: TypeDef] = [:]
        for d in definitions { map[d.type] = d }
        self.defs = map

        var lin: [String: [String]] = [:]
        for t in map.keys {
            var chain: [String] = []
            var seen = Set<String>()
            var cur: String? = t
            while let c = cur {
                if seen.contains(c) { break }      // cycle guard
                guard let d = map[c] else { break } // unknown parent guard
                chain.append(c)
                seen.insert(c)
                cur = d.parent
            }
            lin[t] = chain
        }
        self.lineages = lin
    }

    public func get(_ type: String) -> TypeDef? { defs[type] }
    public func isRegistered(_ type: String) -> Bool { defs[type] != nil }
    public func lineage(_ type: String) -> [String] { lineages[type] ?? [] }

    /// The acceptance rule: a slot requiring `required` accepts `candidate`
    /// iff `required` is in `candidate`'s lineage.
    public func accepts(_ required: String, _ candidate: String) -> Bool {
        guard let l = lineages[candidate] else { return false }
        return l.contains(required)
    }
}

// MARK: - The standard registry (mirrors types.ts)

public extension TypeRegistry {
    static let standard = TypeRegistry([
        TypeDef(type: "object", parent: nil),
        TypeDef(type: "document", parent: "object"),
        TypeDef(type: "note", parent: "document"),
        TypeDef(type: "file", parent: "document"),
        TypeDef(type: "message", parent: "object"),
        TypeDef(type: "slack.message", parent: "message"),
        TypeDef(type: "email.message", parent: "message"),
        TypeDef(type: "person", parent: "object",
                relations: ["owns": SlotDef(accepts: "object", many: true)]),
        TypeDef(type: "cluster", parent: "object",
                slots: ["member": SlotDef(accepts: "object", many: true)]),
        TypeDef(type: "cluster.artifact", parent: "cluster",
                slots: ["member": SlotDef(accepts: "object", many: true)],
                relations: ["produced-from": SlotDef(accepts: "cluster")]),
        TypeDef(type: "move", parent: "object",
                slots: ["step": SlotDef(accepts: "object", many: true)]),
        TypeDef(type: "move.trace", parent: "object",
                relations: ["explains": SlotDef(accepts: "object")]),
        TypeDef(type: "ai.session", parent: "object",
                slots: ["context": SlotDef(accepts: "object", many: true)]),
        TypeDef(type: "search.result", parent: "object",
                relations: ["derived-from": SlotDef(accepts: "object")]),
        TypeDef(type: "loop", parent: "object"),
        TypeDef(type: "alert", parent: "object"),
        TypeDef(type: "source", parent: "object"),
        TypeDef(type: "decision", parent: "object",
                relations: ["blocks": SlotDef(accepts: "object", many: true)]),
    ])
}

// MARK: - Validation helpers (mirror validate.ts)

/// Vault-backed documents are pointers to native files by default; else inline.
public func resolvedStorage(_ object: StewardObject,
                            registry: TypeRegistry = .standard) -> Storage {
    if let s = object.storage { return s }
    return registry.lineage(object.type).contains("document") ? .pointer : .inline
}

/// Check every contains/relates edge against its slot or relation constraint.
/// `resolveType` returns the target's type (from the index, in the real app).
public func checkRefs(_ object: StewardObject,
                      registry: TypeRegistry = .standard,
                      resolveType: (String) -> String?) -> [String] {
    guard let def = registry.get(object.type) else {
        return ["unregistered type: \(object.type)"]
    }
    var issues: [String] = []
    for (i, r) in (object.refs ?? []).enumerated() {
        guard let targetType = resolveType(r.to) else { continue }
        if r.rel == .contains, let slot = r.slot {
            if let s = def.slots[slot] {
                if !registry.accepts(s.accepts, targetType) {
                    issues.append("refs[\(i)]: slot '\(slot)' accepts \(s.accepts); \(targetType) does not inherit it")
                }
            } else {
                issues.append("refs[\(i)]: unknown slot '\(slot)' on \(object.type)")
            }
        }
        if r.rel == .relates, let p = r.predicate, let rel = def.relations[p.rawValue] {
            if !registry.accepts(rel.accepts, targetType) {
                issues.append("refs[\(i)]: relation '\(p.rawValue)' accepts \(rel.accepts); \(targetType) does not inherit it")
            }
        }
    }
    return issues
}
