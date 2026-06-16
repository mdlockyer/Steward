# bridge

The contract between the React UI and the native side, the two channels the
current bridge lacks: request/response RPC and server push.

- `../schema-ts/src/bridge-rpc.ts` is authoritative (typechecked): the method
  map and event map, typed against the Object schema.
- `BridgeRPC.swift` is the native mirror: envelopes, method/event names, and a
  service protocol sketch.

Wire into the existing `WebBridge`: add an `{type:"rpc"}` message type alongside
`{type:"ready"}`, reply via `window.__steward.resolve(id, result)`, and push
events via `window.__steward.emit(event, payload)`.
