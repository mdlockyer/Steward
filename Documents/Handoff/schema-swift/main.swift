import Foundation

// Mirror of src/check.ts. Compile and run:
//   swiftc ObjectModel.swift main.swift -o steward-demo && ./steward-demo

let r = TypeRegistry.standard
var failures = 0

func expect(_ name: String, _ cond: Bool) {
    print("\(cond ? "  ok  " : " FAIL ") \(name)")
    if !cond { failures += 1 }
}

print("\n— the hierarchy rule —")
expect("object accepts a slack.message", r.accepts("object", "slack.message"))
expect("message accepts a slack.message", r.accepts("message", "slack.message"))
expect("move does NOT accept a slack.message (can't BE a move)", !r.accepts("move", "slack.message"))
expect("cluster accepts a cluster.artifact", r.accepts("cluster", "cluster.artifact"))
expect("note inherits document", r.accepts("document", "note"))
expect("unregistered type is rejected", !r.accepts("object", "nonsense.type"))

print("\n— lineages —")
for t in ["slack.message", "note", "cluster.artifact", "move", "search.result"] {
    print("  \(t)  ->  \(r.lineage(t).joined(separator: " -> "))")
}

print("\n— storage defaults —")
let note = StewardObject(
    id: "nt_x", type: "note", ext: nil, title: "x",
    body: .object(["mime": .string("text/markdown"), "path": .string("Decisions/x.md")]),
    refs: nil, provenance: Provenance(source: "obsidian"), index: nil, storage: nil,
    dominantRole: nil, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", meta: nil
)
expect("a note defaults to pointer storage", resolvedStorage(note) == .pointer)

let move = StewardObject(
    id: "mv_x", type: "move", ext: nil, title: "x", body: .object([:]),
    refs: [Ref(rel: .contains, to: "sl_1", predicate: nil, slot: "step", note: nil)],
    provenance: Provenance(source: "model"), index: nil, storage: nil,
    dominantRole: nil, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", meta: nil
)
expect("a move defaults to inline storage", resolvedStorage(move) == .inline)

print("\n— a slack message lives INSIDE a move —")
let issues = checkRefs(move) { id in id == "sl_1" ? "slack.message" : nil }
expect("move's contained slack.message is accepted", issues.isEmpty)

print("\n\(failures == 0 ? "ALL CHECKS PASSED" : "\(failures) CHECK(S) FAILED")\n")
exit(failures == 0 ? 0 : 1)
