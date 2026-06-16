import React from "react";
import { GitBranch, AlertTriangle, Circle, Layers } from "lucide-react";
import { person, ROADMAP_STATUS } from "./data.js";
import { Avatar, PageHead } from "./components.jsx";

/* ============================================================================
   ROADMAP — treated as a living document, so its value is reconciliation rather
   than creation. Steward watches the signals that contradict the plan and
   surfaces slips and broken dependencies as loops, each with a Move to adjust
   the plan or send the status the slip now requires.
   ========================================================================== */

export default function Roadmap({ roadmap, onOpenLoop }) {
  const items = [...roadmap].sort((a, b) => rank(a.date) - rank(b.date));
  const slipping = items.filter((i) => i.status === "slipping").length;
  const atRisk = items.filter((i) => i.status === "atRisk").length;

  return (
    <>
      <div className="sw-scroll">
        <PageHead title="Roadmap" sub="Where reality and the plan disagree — slips and broken dependencies, surfaced as loops." />
        {(slipping > 0 || atRisk > 0) && (
          <div className="sw-fire" style={{ margin: "14px 0 0", borderColor: "rgba(176,106,0,.4)", background: "linear-gradient(180deg,rgba(255,159,10,.08),rgba(255,159,10,.02))" }}>
            <div className="sw-fire-top">
              <span className="sw-fire-ic" style={{ background: "var(--amber)", boxShadow: "0 0 0 4px var(--amber-soft)" }}><AlertTriangle size={16} /></span>
              <div className="sw-fire-main">
                <div className="sw-fire-k" style={{ color: "var(--amber)" }}>Reconciliation needed</div>
                <div className="sw-fire-t">{slipping} slipping · {atRisk} at risk against the Q3 plan</div>
                <div className="sw-fire-sub">The codec slip is propagating to Capture GA. Open it to reconcile the plan.</div>
              </div>
            </div>
          </div>
        )}

        <div className="sw-group" style={{ marginTop: 16 }}>
          {items.map((it) => <RoadmapRow key={it.id} it={it} roadmap={roadmap} onOpenLoop={onOpenLoop} />)}
        </div>
      </div>
    </>
  );
}

function RoadmapRow({ it, roadmap, onOpenLoop }) {
  const s = ROADMAP_STATUS[it.status];
  const owner = person(it.owner);
  const deps = it.deps.map((d) => roadmap.find((x) => x.id === d)).filter(Boolean);
  return (
    <button className="sw-rm-row" onClick={() => it.loopId && onOpenLoop(it.loopId)}>
      <span className="sw-rm-date sw-mono">{it.date}</span>
      <span className="sw-rm-main">
        <span className="sw-rm-name">
          {it.name}
          <span className="sw-rm-status" style={{ color: s.color }}>
            {it.status === "onTrack" ? <Circle size={8} fill={s.color} stroke="none" /> : <AlertTriangle size={11} />} {s.label}
          </span>
        </span>
        <span className="sw-rm-note">{it.note}</span>
        <span style={{ display: "flex", gap: 6, marginTop: 7, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Avatar id={owner.id} size="sm" /><span className="sw-est">{owner.name}</span></span>
          {deps.map((d) => (
            <span className="sw-rm-dep" key={d.id}><GitBranch size={11} /> needs {d.name}</span>
          ))}
        </span>
      </span>
      {it.loopId && (
        <span className="sw-term" style={it.status === "slipping" ? { color: "var(--red)" } : it.status === "atRisk" ? { color: "var(--amber)" } : null}>
          {it.status === "onTrack" ? "tracked loop" : "reconcile →"}
        </span>
      )}
    </button>
  );
}

/* crude month-day ordering for the demo dates ("Jun 16" → 616) */
function rank(date) {
  const m = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  const [mo, d] = date.split(" ");
  return (m[mo] || 0) * 100 + (parseInt(d, 10) || 0);
}
