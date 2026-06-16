import { z } from "zod";
import YAML from "yaml";
import { baseObject, type BaseObject } from "./base";
import { registry } from "./registry";
import "./types"; // ensure all types are registered as a side effect

/* ============================================================================
 * validate.ts — turn raw input (parsed YAML/JSON) into a checked Object.
 *
 *   validateObject(raw)        structural + lineage validation, fills `extends`
 *   accepts(req, candidate)    the hierarchy rule (re-exported)
 *   checkRefs(obj, resolve)    slot/relation acceptance across edges
 *   fromYaml / toYaml          the YAML face over the same schema
 * ========================================================================== */

export { registry } from "./registry";
export const accepts = (required: string, candidate: string) => registry.accepts(required, candidate);

export interface ValidationIssue {
  path: string;
  message: string;
}
export interface ValidationResult {
  ok: boolean;
  object?: BaseObject;
  issues: ValidationIssue[];
}

/** Validate one Object against its registered type. Derives + fills `extends`. */
export function validateObject(raw: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  const typed = raw as { type?: unknown };
  const type = typeof typed?.type === "string" ? typed.type : undefined;
  if (!type) return { ok: false, issues: [{ path: "type", message: "missing `type`" }] };

  const tdef = registry.get(type);
  if (!tdef) return { ok: false, issues: [{ path: "type", message: `unregistered type: ${type}` }] };

  // Compose the concrete schema: base, with type pinned and body specialized.
  const schema = baseObject.extend({
    type: z.literal(type),
    body: tdef.bodySchema,
  });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    for (const e of parsed.error.issues) issues.push({ path: e.path.join("."), message: e.message });
    return { ok: false, issues };
  }

  // Derive lineage and fill/verify `extends`.
  const lineage = registry.lineage(type);
  const given = parsed.data.extends;
  if (given && JSON.stringify(given) !== JSON.stringify(lineage)) {
    issues.push({
      path: "extends",
      message: `lineage mismatch: got [${given.join(", ")}], expected [${lineage.join(", ")}]`,
    });
    return { ok: false, issues };
  }
  // Storage: vault-backed documents are pointers to native files by default;
  // everything else is inline. A pointer must name the canonical file it points
  // at. This is the Obsidian exception: a note's markdown stays on disk, and the
  // Object is metadata pointing to it, never a YAML rewrite of its content.
  const isDocument = lineage.includes("document");
  const storage = parsed.data.storage ?? (isDocument ? "pointer" : "inline");
  if (storage === "pointer") {
    const path = (parsed.data.body as { path?: unknown } | undefined)?.path;
    if (typeof path !== "string" || path.length === 0) {
      issues.push({ path: "body.path", message: "pointer storage requires body.path (the canonical native file)" });
      return { ok: false, issues };
    }
  }

  const object: BaseObject = { ...parsed.data, extends: lineage, storage };
  return { ok: true, object, issues };
}

/**
 * Check that every `contains`/`relates` edge respects its slot or relation
 * constraint. `resolveType(id)` returns the target Object's type (from the
 * index, in a real system). Edges to unknown ids are skipped, not failed.
 */
export function checkRefs(obj: BaseObject, resolveType: (id: string) => string | undefined): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const tdef = registry.get(obj.type);
  if (!tdef) return [{ path: "type", message: `unregistered type: ${obj.type}` }];

  obj.refs.forEach((r, i) => {
    const targetType = resolveType(r.to);
    if (!targetType) return; // unresolved target, nothing to check here
    if (r.rel === "contains" && r.slot) {
      const slot = tdef.slots?.[r.slot];
      if (!slot) {
        issues.push({ path: `refs.${i}.slot`, message: `unknown slot '${r.slot}' on ${obj.type}` });
      } else if (!registry.accepts(slot.accepts, targetType)) {
        issues.push({
          path: `refs.${i}`,
          message: `slot '${r.slot}' accepts ${slot.accepts}; ${targetType} does not inherit it`,
        });
      }
    }
    if (r.rel === "relates" && r.predicate) {
      const rel = tdef.relations?.[r.predicate];
      if (rel && !registry.accepts(rel.accepts, targetType)) {
        issues.push({
          path: `refs.${i}`,
          message: `relation '${r.predicate}' accepts ${rel.accepts}; ${targetType} does not inherit it`,
        });
      }
    }
  });
  return issues;
}

/* ---- the YAML face ----------------------------------------------------- */

/** Parse a YAML Object document and validate it. */
export function fromYaml(text: string): ValidationResult {
  let raw: unknown;
  try {
    raw = YAML.parse(text);
  } catch (e) {
    return { ok: false, issues: [{ path: "(yaml)", message: String(e) }] };
  }
  return validateObject(raw);
}

/** Serialize a validated Object back to YAML (the on-disk face). */
export function toYaml(obj: BaseObject): string {
  return YAML.stringify(obj);
}
