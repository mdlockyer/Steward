import { z } from "zod";

/* ============================================================================
 * registry.ts — the type hierarchy and the one rule that governs it.
 *
 * Every type declares a single `parent` (the root `object` has parent null).
 * The registry computes each type's full lineage and answers the only question
 * the hierarchy exists to answer:
 *
 *   accepts(required, candidate)  ===  required ∈ lineage(candidate)
 *
 * A Move slot requires `move`; a Slack message's lineage is
 * [slack.message, message, object], which has no `move`, so a Slack message can
 * never *be* a Move. But `Move.contains` accepts `object`, so a Move can hold a
 * Slack message. That is the whole "can't be, but can contain" rule, mechanized.
 * ========================================================================== */

export interface SlotDef {
  /** The type a fill must have in its lineage to be accepted. */
  accepts: string;
  many?: boolean;
  required?: boolean;
}

export interface TypeDef {
  type: string;
  /** Single-parent convention. null only for the root `object`. */
  parent: string | null;
  /** Schema for this type's `body`. */
  bodySchema: z.ZodTypeAny;
  /** Named composition slots and what they accept (checked on `contains` refs). */
  slots?: Record<string, SlotDef>;
  /** Constraints on `relates` predicates (e.g. produced-from must target a cluster). */
  relations?: Partial<Record<string, SlotDef>>;
  description?: string;
}

class TypeRegistry {
  private defs = new Map<string, TypeDef>();
  private lineageCache = new Map<string, string[]>();

  register(def: TypeDef): void {
    if (this.defs.has(def.type)) throw new Error(`type already registered: ${def.type}`);
    if (def.parent !== null && !this.defs.has(def.parent)) {
      throw new Error(`parent not registered for ${def.type}: ${def.parent}`);
    }
    this.defs.set(def.type, def);
    this.lineageCache.clear();
  }

  get(type: string): TypeDef | undefined {
    return this.defs.get(type);
  }

  isRegistered(type: string): boolean {
    return this.defs.has(type);
  }

  all(): TypeDef[] {
    return [...this.defs.values()];
  }

  /** [type, parent, ..., "object"]. Throws on an unknown or cyclic type. */
  lineage(type: string): string[] {
    const cached = this.lineageCache.get(type);
    if (cached) return cached;
    const chain: string[] = [];
    const seen = new Set<string>();
    let cur: string | null = type;
    while (cur !== null) {
      if (seen.has(cur)) throw new Error(`cycle in lineage at ${cur}`);
      const def = this.defs.get(cur);
      if (!def) throw new Error(`unknown type in lineage: ${cur}`);
      chain.push(cur);
      seen.add(cur);
      cur = def.parent;
    }
    this.lineageCache.set(type, chain);
    return chain;
  }

  /** The acceptance rule. True iff `required` is in `candidate`'s lineage. */
  accepts(required: string, candidate: string): boolean {
    if (!this.isRegistered(candidate)) return false;
    return this.lineage(candidate).includes(required);
  }
}

export const registry = new TypeRegistry();
