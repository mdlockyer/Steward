import React from "react";
import { createRoot } from "react-dom/client";
import Steward from "./Steward.jsx";

// Dev-only: run the object schema's registry self-check on boot so schema drift
// (a mis-parented type, a slot that accepts an unregistered type) surfaces in the
// console immediately. The per-object ingest lint — validateObject / checkRefs on
// every Object crossing the native bridge — attaches when the bridge lands. The
// dynamic import sits in a DEV-only branch so the schema (and zod/yaml) is never
// pulled into the production bundle.
if (import.meta.env.DEV) {
  import("./schema/index")
    .then(({ selfCheck }) => {
      const r = selfCheck();
      if (r.ok) console.info(`[steward] schema self-check ok — ${r.typeCount} types registered`);
      else console.error("[steward] schema self-check FAILED:", r.issues);
    })
    .catch((e) => console.error("[steward] schema self-check could not run:", e));
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode><Steward /></React.StrictMode>
);
