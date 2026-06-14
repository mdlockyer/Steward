import React from "react";
import { Check, Archive } from "lucide-react";
import { person, MOVE_TYPE } from "./data.js";
import { Avatar, TypeChip, EmptyState } from "./components.jsx";

/* ============================================================================
   LOG — narrows to closed loops: the archive that Carrying graduates into, with
   the full trace of each Move preserved (sources, steps, corrections). It is the
   closed slice of what you were carrying — not a graveyard of finished errands.
   ========================================================================== */

export default function Log({ log }) {
  return (
    <>
      <div className="sw-scroll">
        {log.length === 0 ? (
          <EmptyState icon={Archive} title="Nothing closed yet">
            Close a loop in Carrying, or execute a Move on the Desk, and it lands here.
          </EmptyState>
        ) : (
          <ul className="sw-group" style={{ listStyle: "none", margin: "14px 0 0", padding: 0 }}>
            {log.map((l) => {
              const cp = l.counterparty ? person(l.counterparty) : null;
              return (
                <li className="sw-srcrow" key={l.id}>
                  <span className="sw-srcic" style={{ color: "var(--green)", borderColor: "var(--green-soft)", background: "var(--green-soft)" }}><Check size={17} /></span>
                  <div className="sw-srcmain">
                    <div className="sw-srcname">{l.title}</div>
                    <div className="sw-loop-meta" style={{ marginTop: 4 }}>
                      {l.type && MOVE_TYPE[l.type] && <TypeChip type={l.type} />}
                      {cp && <span className="sw-with"><Avatar id={cp.id} size="sm" /> {cp.name}</span>}
                      <span className="sep">·</span>
                      <span className="sw-fresh sw-mono" style={{ marginTop: 0 }}>{l.trace}</span>
                    </div>
                  </div>
                  <div className="sw-srcmeta">
                    <span className="sw-term">{l.outcome}</span>
                    <div className="sw-fresh">{l.when}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
