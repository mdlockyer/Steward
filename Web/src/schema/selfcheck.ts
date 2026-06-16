import { registry, type SlotDef } from "./registry";
import "./types"; // ensure all core types are registered (ES module eval is cached, so idempotent)

/* ============================================================================
 * selfcheck.ts — the linter checking itself.
 *
 * Registry-integrity guard: every registered type must resolve a clean lineage
 * to the root `object`, and every slot/relation `accepts` must name a registered
 * type. Cheap and file-IO-free, so it is safe to run on every app boot — it
 * catches schema drift (a mis-parented type, a slot pointing at a type that was
 * renamed or never registered) the instant it is introduced, long before any
 * real Object flows through. Per-object validation of live data is
 * `validateObject` / `checkRefs` in validate.ts, attached at the ingest boundary.
 * ========================================================================== */

export interface SelfCheckResult {
  ok: boolean;
  typeCount: number;
  issues: string[];
}

export function selfCheck(): SelfCheckResult {
  const issues: string[] = [];
  const defs = registry.all();

  const checkAccepts = (owner: string, kind: string, name: string, slot: SlotDef | undefined) => {
    if (slot && !registry.isRegistered(slot.accepts)) {
      issues.push(`${owner}.${kind} '${name}' accepts unregistered type '${slot.accepts}'`);
    }
  };

  for (const def of defs) {
    try {
      const lineage = registry.lineage(def.type);
      if (lineage[lineage.length - 1] !== "object") {
        issues.push(`${def.type}: lineage does not terminate at root \`object\` (${lineage.join(" -> ")})`);
      }
    } catch (e) {
      issues.push(`${def.type}: ${(e as Error).message}`);
    }
    for (const [name, slot] of Object.entries(def.slots ?? {})) checkAccepts(def.type, "slot", name, slot);
    for (const [name, rel] of Object.entries(def.relations ?? {})) checkAccepts(def.type, "relation", name, rel);
  }

  return { ok: issues.length === 0, typeCount: defs.length, issues };
}
