import React, { useMemo } from "react";
import {
  ChevronRight, ChevronLeft, Bell, ArrowUpRight, UserPlus, CheckCircle2, Layers,
} from "lucide-react";
import {
  person, priorityOf, LOOP_TYPE, STATE_META, MOVE_TYPE,
} from "./data.js";
import { Avatar, SevDot, AgeBadge, TypeChip, EmptyState, PageHead } from "./components.jsx";

/* ============================================================================
   CARRYING — the new substrate and the largest addition. Every open loop in one
   place: commitments made, things waited on, asks in flight, fire status,
   roadmap risks. Each loop shows owner, counterparty, state, age, and next
   nudge. Meetings, roadmap, and budget are mostly views onto this.
   ========================================================================== */

const LANES = {
  all:    () => true,
  needs:  (l) => ["open", "inFlight", "escalated"].includes(l.state),
  waiting:(l) => ["waiting", "scheduled"].includes(l.state),
  risk:   (l) => l.type === "fire" || l.type === "roadmap" || ["atRisk", "escalated", "blocked"].includes(l.state),
};

export default function Carrying({ loops, seg, setSeg, onOpen }) {
  const ranked = useMemo(
    () => loops.map((l) => ({ ...l, priority: priorityOf(l) })).sort((a, b) => b.priority - a.priority),
    [loops]
  );
  const count = (k) => ranked.filter(LANES[k]).length;
  const segs = [["all", "All"], ["needs", "Needs you"], ["waiting", "Waiting"], ["risk", "Fires & risks"]];
  const shown = ranked.filter(LANES[seg]);

  return (
    <div className="sw-scroll">
      <PageHead title="Carrying" sub="Every open loop you're carrying — owner, counterparty, state, and age.">
        <div className="sw-seg" role="group" aria-label="Filter loops">
          {segs.map(([k, l]) => (
            <button key={k} aria-pressed={seg === k} onClick={() => setSeg(k)}>
              {l}<span className="sw-seg-n">{count(k)}</span>
            </button>
          ))}
        </div>
      </PageHead>
      {shown.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing here right now">
          Loops in this state graduate to the Log as they close.
        </EmptyState>
      ) : (
        <ul className="sw-group" style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
          {shown.map((l) => <LoopRow key={l.id} l={l} onOpen={onOpen} />)}
        </ul>
      )}
    </div>
  );
}

function LoopRow({ l, onOpen }) {
  const t = LOOP_TYPE[l.type]; const Glyph = t.ic;
  const sm = STATE_META[l.state];
  const cp = person(l.counterparty);
  return (
    <li>
      <button className="sw-row" onClick={() => onOpen(l.id)} style={{ alignItems: "center" }}>
        <span className="sw-loop-left">
          <span className="sw-loop-glyph" style={{ color: t.color }}>
            <Glyph /><SevDot sev={l.severity} />
          </span>
          <span className="sw-row-main">
            <span className="sw-row-title">{l.title}</span>
            <span className="sw-loop-meta">
              <span style={{ color: sm.color, fontWeight: 600 }}>{sm.label}</span>
              <span className="sep">·</span>
              <span className="sw-with"><Avatar id={cp.id} size="sm" /> {cp.name}</span>
              <span className="sep">·</span>
              <span style={{ color: t.color, fontWeight: 600 }}>{t.label}</span>
            </span>
          </span>
        </span>
        <span className="sw-row-right">
          <AgeBadge age={l.age} nudge={l.nextNudge === "overdue" ? "overdue" : l.nextNudge === "now" ? "now" : null} />
          {l.move && <span className="sw-term"><span className="sw-typechip" style={{ padding: 0, background: "none" }}>{MOVE_TYPE[l.move.type].label} ready</span></span>}
          <ChevronRight size={17} className="sw-chev" />
        </span>
      </button>
    </li>
  );
}

/* ----------------------------- loop detail ------------------------------- */
export function LoopDetail({ l, onBack, onOpenMove, onNudge, onEscalate, onClose }) {
  const t = LOOP_TYPE[l.type]; const Glyph = t.ic;
  const sm = STATE_META[l.state];
  const owner = person(l.owner); const cp = person(l.counterparty);
  const canEscalate = l.type !== "fire" && l.state !== "escalated";

  return (
    <div className="sw-scroll" style={{ paddingTop: 22 }}>
      <button className="sw-back" onClick={onBack}><ChevronLeft size={17} /> Carrying</button>

      <div className="sw-ld-head">
        <span className="sw-ld-glyph" style={{ color: t.color }}><Glyph /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
            <span className="sw-typechip" style={{ color: t.color }}><Glyph /> {t.label}</span>
            <span style={{ color: sm.color, fontWeight: 700, fontSize: 12 }}>{sm.label}</span>
          </div>
          <h1 className="sw-ld-title">{l.title}</h1>
          <p className="sw-ld-ctx">{l.context}</p>
        </div>
      </div>

      <div className="sw-meta" style={{ marginTop: 16 }}>
        <div className="sw-meta-i"><span className="sw-meta-k">Owner</span>
          <span className="sw-meta-v" style={{ display: "flex", alignItems: "center", gap: 7 }}><Avatar id={owner.id} size="sm" /> {owner.name}</span></div>
        <div className="sw-meta-i"><span className="sw-meta-k">Counterparty</span>
          <span className="sw-meta-v" style={{ display: "flex", alignItems: "center", gap: 7 }}><Avatar id={cp.id} size="sm" /> {cp.name}</span></div>
        <div className="sw-meta-i"><span className="sw-meta-k">Age</span><span className="sw-meta-v sw-mono">{l.age}</span></div>
        <div className="sw-meta-i"><span className="sw-meta-k">Next nudge</span>
          <span className="sw-meta-v sw-mono" style={l.nextNudge === "overdue" ? { color: "var(--red)" } : null}>{l.nextNudge}</span></div>
        <div className="sw-meta-i"><span className="sw-meta-k">Priority</span><span className="sw-meta-v sw-mono">{priorityOf(l)}</span></div>
      </div>

      <div className="sw-ld-acts">
        {l.move && (
          <button className="sw-btn sw-btn-pri" onClick={() => onOpenMove(l.id)}>
            {React.createElement(MOVE_TYPE[l.move.type].ic, { size: 14 })} Open the {MOVE_TYPE[l.move.type].label} Move
          </button>
        )}
        <button className="sw-btn sw-btn-ghost" onClick={() => onNudge(l.id)}><Bell size={14} /> Nudge {cp.name.split(" ")[0]}</button>
        {canEscalate && <button className="sw-btn sw-btn-ghost" onClick={() => onEscalate(l.id)}><ArrowUpRight size={14} /> Escalate</button>}
        <button className="sw-btn sw-btn-text" onClick={() => onClose(l.id)} style={{ color: "var(--green)" }}><CheckCircle2 size={14} /> Mark closed</button>
      </div>

      <div className="sw-sec-h">History</div>
      <div className="sw-tl">
        {l.trace.map((e, i) => (
          <div className="sw-tl-row" data-kind={e.kind} key={i}>
            <span className="sw-tl-dot"><i /></span>
            <div className="sw-tl-when sw-mono">{e.when}</div>
            <div className="sw-tl-label">{e.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
