# schema-swift

Swift port of the Steward object model: base `StewardObject` (Codable), the
`TypeRegistry`, the acceptance rule, and validation helpers. Mirrors the
verified TypeScript in `../schema-ts`. Swift 6, value types only (Sendable).

Verified: typechecks under Swift 6 language mode (strict concurrency) and the
behavior demo passes. Re-verify any time:
```bash
swiftc -typecheck ObjectModel.swift main.swift     # compiles clean -> no output
swiftc ObjectModel.swift main.swift -o demo && ./demo   # runs the acceptance checks
```
Then port `ObjectModel.swift` into `Sources/ObjectModel/`, add to `project.yml`,
and `make project`.
