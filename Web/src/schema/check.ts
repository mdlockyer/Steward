import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { registry } from "./registry";
import { fromYaml, checkRefs, accepts, validateObject } from "./validate";
import "./types";

const here = dirname(fileURLToPath(import.meta.url));
let failures = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "  ok  " : " FAIL "} ${name}`);
  if (!cond) failures++;
}

console.log("\n— the hierarchy rule —");
check("object accepts a slack.message", accepts("object", "slack.message"));
check("message accepts a slack.message", accepts("message", "slack.message"));
check("move does NOT accept a slack.message (can't BE a move)", !accepts("move", "slack.message"));
check("cluster accepts a cluster.artifact", accepts("cluster", "cluster.artifact"));
check("note inherits document", accepts("document", "note"));
check("unregistered type is rejected", !accepts("object", "nonsense.type"));

console.log("\n— lineages —");
for (const t of ["slack.message", "note", "cluster.artifact", "move", "search.result"]) {
  console.log(`  ${t}  ->  ${registry.lineage(t).join(" -> ")}`);
}

console.log("\n— example files validate —");
const dir = join(here, "examples");
const objectsById = new Map<string, string>();
const files = readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort();
for (const f of files) {
  const res = fromYaml(readFileSync(join(dir, f), "utf8"));
  check(`${f} validates`, res.ok);
  if (!res.ok) res.issues.forEach((i) => console.log(`         · ${i.path}: ${i.message}`));
  else objectsById.set(res.object!.id, res.object!.type);
}

console.log("\n— cross-object ref acceptance (slack message lives INSIDE a move) —");
const resolve = (id: string) => objectsById.get(id);
const moveRes = fromYaml(readFileSync(join(dir, "move.yaml"), "utf8"));
if (moveRes.ok) {
  const issues = checkRefs(moveRes.object!, resolve);
  check("move.yaml refs all accepted", issues.length === 0);
  issues.forEach((i) => console.log(`         · ${i.path}: ${i.message}`));
}

console.log("\n— rejecting an illegal slot fill —");
// A cluster whose `member` slot is fine with anything (accepts object), vs. a
// hypothetical strict slot. We prove the negative path with a synthetic check:
const strictAccepts = accepts("move", "slack.message"); // false
check("a slack.message cannot fill a move-typed slot", strictAccepts === false);

console.log("\n— Obsidian/vault content stays native (pointer storage) —");
const noteRes2 = fromYaml(readFileSync(join(dir, "note.yaml"), "utf8"));
check("note uses pointer storage", noteRes2.ok && noteRes2.object!.storage === "pointer");
check(
  "note points at a markdown file",
  noteRes2.ok && /\.md$/.test(String((noteRes2.object!.body as { path?: string }).path ?? "")),
);
const moveStorage = fromYaml(readFileSync(join(dir, "move.yaml"), "utf8"));
check("move uses inline storage", moveStorage.ok && moveStorage.object!.storage === "inline");
const badPointer = validateObject({
  id: "nt_nopath",
  type: "note",
  title: "missing path",
  storage: "pointer",
  provenance: { source: "obsidian" },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  body: { mime: "text/markdown" },
});
check("a pointer note without a path is rejected", !badPointer.ok);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
