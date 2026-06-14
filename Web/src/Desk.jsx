import React, { useMemo } from "react";
import { ChevronRight, X, Sparkles, Inbox } from "lucide-react";
import { person, priorityOf, MOVE_TYPE } from "./data.js";
import { Avatar, SevDot, AgeBadge, TypeChip, EmptyState } from "./components.jsx";

/* ============================================================================
   DESK — the present-tense attention surface: what needs you right now.
   Reframed: ranked by severity × needle-impact, NOT confidence. A fire outranks
   a tidy retro summary; confidence is demoted to a per-proposal quality signal.
   Each Desk item is a loop carrying a ready Move.
   ========================================================================== */

const LANES = {
  all:      (m) => true,
  fire:     (m, l) => m.type === "escalate" || l.severity >= 85,
  decision: (m) => m.type === "reconcile" || m.type === "pitch",
  routine:  (m) => m.type === "errand" || m.type === "delegate" || m.type === "prep",
};

export default function Desk({ loops, seg, setSeg, onOpen, onDismiss }) {
  // Desk = loops carrying a ready Move, ranked by priority (severity × needle).
  const deskLoops = useMemo(
    () => loops.filter((l) => l.move).map((l) => ({ ...l, priority: priorityOf(l) }))
      .sort((a, b) => b.priority - a.priority),
    [loops]
  );
  const count = (k) => deskLoops.filter((l) => LANES[k](l.move, l)).length;
  const segs = [["all", "All"], ["fire", "Fires"], ["decision", "Decisions"], ["routine", "Routine"]];
  const shown = deskLoops.filter((l) => LANES[seg](l.move, l));

  return (
    <>
      <div className="sw-seg" role="group" aria-label="Filter the Desk">
        {segs.map(([k, l]) => (
          <button key={k} aria-pressed={seg === k} onClick={() => setSeg(k)}>
            {l}<span className="sw-seg-n">{count(k)}</span>
          </button>
        ))}
      </div>
      <div className="sw-scroll">
        {shown.length === 0 ? (
          <EmptyState icon={seg === "fire" ? Inbox : Sparkles}
            title={seg === "all" ? "Desk clear" : "Nothing in this lane"}>
            {seg === "all"
              ? "Steward is listening. New Moves surface here as activity comes in."
              : "Steward routes Moves into this lane as they qualify."}
          </EmptyState>
        ) : (
          <ul className="sw-group" style={{ listStyle: "none", margin: "14px 0 0", padding: 0 }}>
            {shown.map((l) => <DeskRow key={l.id} l={l} onOpen={onOpen} onDismiss={onDismiss} />)}
          </ul>
        )}
      </div>
    </>
  );
}

function DeskRow({ l, onOpen, onDismiss }) {
  const m = l.move;
  const cp = person(l.counterparty);
  return (
    <li>
      <button className="sw-row" onClick={() => onOpen(l.id)}>
        <SevDot sev={l.severity} />
        <span className="sw-row-main">
          <span className="sw-row-title">{l.title}</span>
          <span className="sw-row-line">
            <TypeChip type={m.type} />
            <span className="sw-with"><Avatar id={cp.id} size="sm" /> {cp.name}</span>
            <span className="sw-srcs">{l.srcs.slice(0, 2).map((s) => <span key={s} className="sw-tag">{s}</span>)}</span>
          </span>
        </span>
        <span className="sw-row-right">
          <span className="sw-state">
            <span className="sw-prio">Priority {l.priority}</span>
            <span className="sw-conf sw-mono">{m.conf}% · est.</span>
          </span>
          <span className="sw-term">→ {m.terminal}</span>
          <ChevronRight size={17} className="sw-chev" />
        </span>
      </button>
      <button className="sw-dismiss" aria-label="Dismiss this Move"
        onClick={(e) => { e.stopPropagation(); onDismiss(l.id); }}><X size={14} /></button>
    </li>
  );
}
