import React from "react";
import {
  ChevronLeft, ChevronRight, Calendar, ClipboardList, GitBranch, Check,
  CornerDownRight, CheckCircle2,
} from "lucide-react";
import { person } from "./data.js";
import { Avatar, AvatarStack, EmptyState } from "./components.jsx";

/* ============================================================================
   MEETINGS — a first-class object, not a transcript fed in after the fact.
   Before: a prep brief (what it's about, what you owe these people, what's open
   with them, decisions pending). After: commitments fan out of the meeting into
   Carrying as tracked loops, and decisions land in a decision log.
   ========================================================================== */

export default function Meetings({ meetings, onOpen }) {
  const upcoming = meetings.filter((m) => m.status === "upcoming").sort((a, b) => a.whenRank - b.whenRank);
  const past = meetings.filter((m) => m.status === "past").sort((a, b) => b.whenRank - a.whenRank);
  return (
    <>
      <div className="sw-top">
        <div>
          <h1 className="sw-h1">Meetings</h1>
          <p className="sw-sub">Prep before, capture during, fan-out after. Commitments become tracked loops in Carrying; decisions land in a log.</p>
        </div>
      </div>
      <div className="sw-scroll">
        <div className="sw-group-h">Upcoming <span className="sw-gh-n">{upcoming.length}</span></div>
        <div className="sw-group">
          {upcoming.map((m) => <MeetingRow key={m.id} m={m} onOpen={onOpen} />)}
        </div>
        <div className="sw-group-h" style={{ marginTop: 26 }}>Recent <span className="sw-gh-n">{past.length}</span></div>
        <div className="sw-group">
          {past.map((m) => <MeetingRow key={m.id} m={m} onOpen={onOpen} />)}
        </div>
      </div>
    </>
  );
}

function MeetingRow({ m, onOpen }) {
  const open = m.status === "past" ? (m.commitments?.length || 0) : 0;
  return (
    <button className="sw-row" onClick={() => onOpen(m.id)}>
      <span className="sw-loop-glyph" style={{ color: m.status === "upcoming" ? "var(--accent)" : "var(--ink-3)" }}>
        <Calendar />
      </span>
      <span className="sw-row-main">
        <span className="sw-row-title">{m.title}</span>
        <span className="sw-loop-meta">
          <span className="sw-mt-when">{m.when}</span>
          <span className="sep">·</span>
          <AvatarStack ids={m.attendees} />
        </span>
      </span>
      <span className="sw-row-right">
        <span className="sw-term">{m.status === "upcoming" ? "Prep brief" : `${m.commitments.length} commitments`}</span>
        <ChevronRight size={17} className="sw-chev" />
      </span>
    </button>
  );
}

/* ------------------------------ meeting detail --------------------------- */
export function MeetingDetail({ m, onBack, onFanOut, loops }) {
  const isUp = m.status === "upcoming";
  return (
    <div className="sw-scroll" style={{ paddingTop: 22 }}>
      <button className="sw-back" onClick={onBack}><ChevronLeft size={17} /> Meetings</button>
      <div className="sw-insp-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span className="sw-typechip" style={{ color: isUp ? "var(--accent)" : "var(--ink-2)" }}>
            <Calendar /> {isUp ? "Upcoming" : "Recent"}
          </span>
          <span className="sw-mt-when">{m.when}</span>
        </div>
        <h1 className="sw-insp-title">{m.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 11 }}>
          <AvatarStack ids={m.attendees} />
          <span className="sw-est">{m.attendees.map((a) => person(a).name).join(" · ")}</span>
        </div>
      </div>

      {isUp ? (
        <PrepBrief prep={m.prep} />
      ) : (
        <Recap m={m} onFanOut={onFanOut} loops={loops} />
      )}
    </div>
  );
}

function PrepBrief({ prep }) {
  return (
    <>
      <div className="sw-card-lg" style={{ marginTop: 18 }}>
        <h3><ClipboardList size={13} /> What this is about</h3>
        <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55, margin: 0 }}>{prep.about}</p>
      </div>
      <div className="sw-mt-sec">
        <div className="sw-card-lg">
          <h3>What you owe them</h3>
          {prep.owe.map((x, i) => <div className="sw-li" key={i}>{x}</div>)}
        </div>
        <div className="sw-card-lg">
          <h3>What's open with them</h3>
          {prep.open.map((x, i) => <div className="sw-li" key={i}>{x}</div>)}
        </div>
      </div>
      <div className="sw-card-lg" style={{ marginTop: 12 }}>
        <h3>Decisions pending</h3>
        {prep.decisions.map((x, i) => <div className="sw-li" key={i}>{x}</div>)}
      </div>
      <p className="sw-est" style={{ margin: "14px 4px 0" }}>This is a read-only prep brief — a prep Move with no outbound, so no approval gate.</p>
    </>
  );
}

function Recap({ m, onFanOut, loops }) {
  const liveLoopIds = new Set(loops.map((l) => l.id));
  return (
    <>
      <div className="sw-card-lg" style={{ marginTop: 18 }}>
        <h3><ClipboardList size={13} /> Summary</h3>
        <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55, margin: 0 }}>{m.summary}</p>
      </div>

      <div className="sw-card-lg" style={{ marginTop: 12 }}>
        <h3><GitBranch size={13} /> Commitments → Carrying</h3>
        {m.commitments.map((c, i) => {
          const owner = person(c.owner); const cp = person(c.counterparty);
          const isLive = c.fanned && c.loopId && liveLoopIds.has(c.loopId);
          return (
            <div className="sw-commit" key={i}>
              <CornerDownRight size={15} style={{ color: "var(--ink-3)", flex: "0 0 auto" }} />
              <div className="sw-commit-main">
                <div className="sw-commit-t">{c.text}</div>
                <div className="sw-commit-who">
                  <Avatar id={owner.id} size="sm" /> {owner.name}
                  <span style={{ opacity: .5 }}>→</span>
                  <Avatar id={cp.id} size="sm" /> {cp.name}
                </div>
              </div>
              {isLive ? (
                <span className="sw-fanned"><Check size={12} /> In Carrying</span>
              ) : (
                <button className="sw-btn sw-btn-ghost" onClick={() => onFanOut(m.id, i)}>
                  <GitBranch size={13} /> Fan out
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="sw-card-lg" style={{ marginTop: 12 }}>
        <h3><CheckCircle2 size={13} /> Decision log</h3>
        {m.decisions.map((d, i) => (
          <div className="sw-decision" key={i}>
            <Check size={15} />
            <div><span style={{ fontWeight: 500 }}>{d.text}</span>
              <span className="sw-est" style={{ marginLeft: 7 }}>— {person(d.by).name}</span></div>
          </div>
        ))}
      </div>
    </>
  );
}
