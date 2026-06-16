# steward-schema

The object model under all of Steward: one base `Object`, a single-parent type
registry, the acceptance rule, a Zod validator, and a YAML face. Verified to
typecheck and pass its acceptance/validation checks on Node 22.

## Run
```bash
npm install
npm run typecheck   # tsc --noEmit
npm run check       # asserts the hierarchy rules + validates every example
```

## Files
- `src/base.ts` — primitives: id, refs (contains/relates), provenance, index,
  scope knob, gate, spine node, and the BaseObject every primitive shares.
- `src/registry.ts` — the type hierarchy and `accepts(required, candidate)`,
  the one rule the lineage exists to answer.
- `src/types.ts` — the registered hierarchy (object → document/note/file,
  message/slack/email, person, cluster/cluster.artifact, move, move.trace,
  ai.session, search.result, loop, alert, source, decision).
- `src/validate.ts` — `validateObject`, `checkRefs`, `fromYaml`, `toYaml`.
- `src/check.ts` — runnable proof (the Slack-can't-be-a-Move case, etc.).
- `examples/*.yaml` — one valid instance per primitive, including a Slack
  message living inside a Move.
- `CLUSTERS.md` — how this maps to the product (supersedes Moves-as-home).

## How it plugs into the app
This is the engine, not the face. Author/vault-native Objects are YAML-fronted
files on disk; ingested/ephemeral Objects (Slack, search results) live in the
local index with a YAML projection on demand. The validator here is the linter
for both. Drop it in as `Web/src/schema/` (web side) or port the registry to
Swift for the native index, whichever owns the store.
