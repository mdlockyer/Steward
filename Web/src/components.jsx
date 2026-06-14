import React, { useState } from "react";
import {
  ChevronLeft, ChevronRight, Check, Circle, Clock, Send, Search, Link2, Radio,
  RotateCw, Sparkles, Ticket, MessageSquare, PenLine, AlertTriangle, Users,
  FileText, Layers, DollarSign, ArrowRight, ShieldAlert, Lightbulb,
} from "lucide-react";
import { PEOPLE, person, MOVE_TYPE, sevBucket } from "./data.js";

/* ============================================================================
   Shared primitives + the Move spine. The spine, its gates, and the
   correct-and-recompute loop carry over from the prototype unchanged; only the
   set of artifact blocks a node can render is widened (numbers, brief, status
   update, reassignment) and the gate is made audience-aware.
   ========================================================================== */

/* --------------------------------- atoms --------------------------------- */
export function Avatar({ id, size }) {
  const p = person(id);
  return <span className={"sw-av" + (size ? " " + size : "")} style={{ background: p.color }} title={p.name}>{p.initials}</span>;
}
export function AvatarStack({ ids }) {
  return <span className="sw-avstack">{ids.map((id) => <Avatar key={id} id={id} size="sm" />)}</span>;
}
export function SevDot({ sev }) {
  return <span className="sw-sevdot" style={{ background: sevBucket(sev).color }} title={`Severity ${sev}`} />;
}
export function AgeBadge({ age, nudge }) {
  const cls = nudge === "overdue" ? " is-overdue" : nudge === "now" ? " is-now" : "";
  return <span className={"sw-age" + cls}><Clock size={11} /> {age}</span>;
}
export function TypeChip({ type }) {
  const m = MOVE_TYPE[type]; if (!m) return null;
  const Ic = m.ic;
  return <span className="sw-typechip"><Ic /> {m.label}</span>;
}
export function EmptyState({ icon: Icon = Sparkles, title, children }) {
  return (
    <div className="sw-empty">
      <div className="sw-empty-ic"><Icon size={20} /></div>
      <b>{title}</b>{children}
    </div>
  );
}

/* ------------------------------ spine plumbing --------------------------- */
const NODE_ICON = {
  observe: Radio, connect: Link2, retrieve: Search, send: MessageSquare,
  await: Clock, create: Ticket, assess: AlertTriangle, route: Users,
  compose: FileText, brief: FileText,
};
const NODE_LABEL = {
  observe: "Observe", connect: "Connect", retrieve: "Retrieve", send: "Draft & send",
  await: "Await reply", create: "Create artifact", assess: "Assess severity",
  route: "Route to owner", compose: "Compose", brief: "Brief",
};
const FB_CHIPS = ["Wrong source", "Wrong choice", "Tone is off", "Missing context", "Wrong owner", "Not needed"];
const STAKES_LABEL = { peer: "a peer", lead: "a lead", vp: "your VP", exec: "an exec" };

/* ------------------------------ Move inspector --------------------------- */
export function MoveInspector({ loop, m, onBack, backLabel = "Back", onStudio, actions }) {
  const [fbNode, setFbNode] = useState(null);
  const [fbChips, setFbChips] = useState([]);
  const [fbText, setFbText] = useState("");
  const typeMeta = MOVE_TYPE[m.type];
  const cp = loop ? person(loop.counterparty) : null;

  return (
    <div className="sw-scroll" style={{ paddingTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button className="sw-back" onClick={onBack} style={{ marginBottom: 0 }}><ChevronLeft size={17} /> {backLabel}</button>
        {onStudio && <button className="sw-btn sw-btn-ghost" onClick={() => onStudio(m, loop)}><Sparkles size={14} /> Continue in Studio</button>}
      </div>

      <div className="sw-insp-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
          <TypeChip type={m.type} />
          {typeMeta && <span className="sw-est">{typeMeta.hint}</span>}
        </div>
        <h1 className="sw-insp-title">{loop ? loop.title : m.title}</h1>
        {loop && <p className="sw-throughline">{loop.context}</p>}
        <div className="sw-meta">
          <div className="sw-meta-i"><span className="sw-meta-k">Confidence</span>
            <span className="sw-meta-v sw-mono">{m.conf}% <span className="sw-est">· Steward's estimate</span></span></div>
          {loop && <div className="sw-meta-i"><span className="sw-meta-k">Counterparty</span>
            <span className="sw-meta-v" style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {cp && <Avatar id={cp.id} size="sm" />}{cp ? cp.name : "—"}</span></div>}
          {loop && <div className="sw-meta-i"><span className="sw-meta-k">Age</span>
            <span className="sw-meta-v sw-mono">{loop.age}</span></div>}
          <div className="sw-meta-i"><span className="sw-meta-k">Ends in</span>
            <span className="sw-meta-v">{m.terminal}</span></div>
          <div className="sw-meta-i"><span className="sw-meta-k">Steps</span>
            <span className="sw-meta-v sw-mono">{m.nodes.length}</span></div>
        </div>
      </div>

      <ol className="sw-spine" style={{ listStyle: "none", padding: "0 0 0 30px", margin: "22px 0 0" }}>
        <span className="sw-line" />
        {m.nodes.map((n, i) => (
          <SpineNode key={n.id} n={n} isLast={i === m.nodes.length - 1}
            fbOpen={fbNode === n.id}
            onFbToggle={() => { setFbNode(fbNode === n.id ? null : n.id); setFbChips([]); setFbText(""); }}
            fbChips={fbChips} setFbChips={setFbChips} fbText={fbText} setFbText={setFbText}
            onFbSubmit={() => {
              const note = [...fbChips, fbText].filter(Boolean).join(" · ");
              setFbNode(null); setFbChips([]); setFbText("");
              actions.submitFeedback(n.id, note);
            }}
            actions={actions} />
        ))}
      </ol>
    </div>
  );
}

function SpineNode({ n, isLast, fbOpen, onFbToggle, fbChips, setFbChips, fbText, setFbText, onFbSubmit, actions }) {
  const [confirming, setConfirming] = useState(false);
  const Ic = NODE_ICON[n.type] || Circle;
  const st = n.status;
  const dotIcon = st === "settled" || st === "done" ? <Check /> : st === "recomputing" ? <RotateCw /> : <Ic />;
  const showAdjust = ["edge", "settled", "gate"].includes(st) && st !== "done";
  const stakes = n.audience?.stakes;
  const highStakes = stakes === "lead" || stakes === "vp" || stakes === "exec";

  return (
    <li className="sw-node" data-st={st}>
      <span className="sw-nodedot">{dotIcon}</span>
      <div className="sw-card">
        <div className="sw-ntype">
          {NODE_LABEL[n.type] || "Step"}
          {typeof n.conf === "number" && st !== "recomputing" && (
            <span className="sw-nconf sw-mono">{n.conf}% est.</span>
          )}
        </div>
        <div className="sw-ntitle">{n.title}</div>

        {st === "recomputing" ? (
          <div className="sw-nbody">Re-deriving this step from your feedback…</div>
        ) : (
          <>
            {n.body && <div className="sw-nbody">{n.body}</div>}
            {n.severityNote && (
              <div className="sw-aud" style={{ borderColor: "rgba(192,57,43,.35)", background: "var(--red-soft)" }}>
                <ShieldAlert size={15} style={{ color: "var(--red)" }} />
                <span><b style={{ color: "var(--red)" }}>{n.severityNote}</b></span>
              </div>
            )}

            {n.parts && (
              <div className="sw-parts">
                {n.parts.map((p, i) => (
                  <div className="sw-part" key={i}>
                    <b>{p.name}</b><span className="sw-spec">{p.spec}</span>
                    <span className="sw-amz">AMAZON</span>
                    <span className="sw-price sw-mono">{p.price}</span>
                  </div>
                ))}
              </div>
            )}

            {n.numbers && (
              <div className="sw-nums">
                {n.numbers.map((x, i) => (
                  <div className={"sw-num" + (x.flag ? " flag" : "")} key={i}>
                    <span className="sw-num-l">{x.label}</span>
                    <span className="sw-num-v sw-mono">{x.value}</span>
                    <span className="sw-num-n">{x.note}</span>
                  </div>
                ))}
              </div>
            )}

            {n.retrieved && (
              <div className="sw-cites">
                {n.retrieved.map((c, i) => (
                  <div className="sw-cite" key={i}>
                    <div className="sw-cite-top">
                      <span className="sw-cite-note"><FileText /> {c.note}</span>
                      <span className="sw-cite-score sw-mono">{c.score.toFixed(2)}</span>
                    </div>
                    <div className="sw-cite-snip">“{c.snippet}”</div>
                  </div>
                ))}
              </div>
            )}

            {n.brief && (
              <div className="sw-brief">
                <div className="sw-brief-h"><FileText size={13} /> {n.brief.kind}</div>
                <div className="sw-brief-body">
                  {n.brief.sections ? n.brief.sections.map((s, i) => (
                    <div className="sw-brief-sec" key={i}>
                      <div className="sw-brief-sh">{s.h}</div>
                      {s.items.map((it, j) => <div className="sw-brief-li" key={j}>{it}</div>)}
                    </div>
                  )) : (n.brief.points || []).map((p, i) => <div className="sw-brief-li" key={i}>{p}</div>)}
                </div>
              </div>
            )}

            {n.reassign && (
              <div className="sw-reassign">
                <span className="sw-reassign-who">
                  <span className="sw-tag">{n.reassign.from}</span>
                </span>
                <ArrowRight size={16} className="sw-reassign-arrow" />
                <span className="sw-reassign-who">
                  <Avatar id={n.reassign.to === "Dmitri Volkov" ? "dmitri" : ownerIdByName(n.reassign.to)} size="sm" />
                  <span>
                    <span className="sw-reassign-name">{n.reassign.to}</span>
                    <span className="sw-reassign-reason">{n.reassign.reason}</span>
                  </span>
                </span>
              </div>
            )}

            {n.message && (
              <div className="sw-bubble">
                <div className="sw-bubble-to"><Send size={11} /> To {n.to}</div>{n.message}
              </div>
            )}

            {n.statusUpdate && (
              <div className="sw-status">
                <div className="sw-status-h"><Radio size={14} /> {n.statusUpdate.headline}</div>
                <div className="sw-status-b">{n.statusUpdate.body}</div>
              </div>
            )}

            {(n.type === "send") && highStakes && st === "gate" && (
              <div className="sw-aud">
                <ShieldAlert size={15} />
                <span><b>Goes to {STAKES_LABEL[stakes]}.</b> Steward raises the bar — preview the exact message and confirm before it sends.</span>
              </div>
            )}

            {n.type === "await" && (
              n.gotReply
                ? <div className="sw-reply">{n.reply}</div>
                : <div className="sw-nbody" style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8 }}>
                    <Clock size={13} /> {st === "await" ? "Waiting on their reply." : "Sends here once the message above is approved."}
                  </div>
            )}

            {n.ticket && (
              <div className="sw-ticket">
                <div className="sw-tk-head"><Ticket size={13} /> {n.ticket.project} · {n.ticket.type}</div>
                <div className="sw-tk-row"><span className="sw-tk-k">Summary</span><span className="sw-tk-v">{n.ticket.summary}</span></div>
                <div className="sw-tk-row"><span className="sw-tk-k">Assignee</span><span className="sw-tk-v">{n.ticket.assignee}</span></div>
                <div className="sw-tk-row"><span className="sw-tk-k">Links</span><span className="sw-tk-v">{n.ticket.links}</span></div>
              </div>
            )}

            {n.srcs && n.srcs.length > 0 && (
              <div className="sw-nsrc">{n.srcs.map((s) => <span key={s} className="sw-tag">{s}</span>)}</div>
            )}

            {n.recomputed && st === "pending" && (
              <div style={{ marginTop: 10 }}><span className="sw-recomp"><RotateCw size={13} style={{ animation: "none" }} /> Revised from your feedback</span></div>
            )}

            {/* node actions by state */}
            <div className="sw-nact">
              {st === "edge" && (
                <>
                  <button className="sw-btn sw-btn-pri" onClick={() => actions.acceptNode(n.id)}>
                    <Check /> {n.type === "brief" ? "Got it — I'm ready" : "Looks right"}
                  </button>
                  {n.type !== "brief" && <button className="sw-btn sw-btn-text" onClick={onFbToggle}><PenLine size={14} /> Adjust</button>}
                </>
              )}

              {st === "gate" && n.type === "send" && !confirming && (
                <>
                  <button className="sw-btn sw-btn-amber" onClick={() => highStakes ? setConfirming(true) : actions.approveSend(n.id)}>
                    <Send /> {highStakes ? "Review & send" : "Approve & send"}
                  </button>
                  <button className="sw-btn sw-btn-text" onClick={onFbToggle}><PenLine size={14} /> Adjust draft</button>
                </>
              )}
              {st === "gate" && n.type === "send" && confirming && (
                <div style={{ display: "flex", flexDirection: "column", gap: 9, width: "100%" }}>
                  <div className="sw-aud"><ShieldAlert size={15} /><span>Send this to <b>{n.to}</b>? This reaches {STAKES_LABEL[stakes]}.</span></div>
                  <div className="sw-nact" style={{ marginTop: 0 }}>
                    <button className="sw-btn sw-btn-red" onClick={() => { setConfirming(false); actions.approveSend(n.id); }}><Send /> Confirm & send</button>
                    <button className="sw-btn sw-btn-text" onClick={() => setConfirming(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {st === "gate" && n.type === "create" && (
                <>
                  <button className="sw-btn sw-btn-amber" onClick={() => actions.executeCreate(n.id)}>
                    <Ticket /> Execute · {n.ticket?.type?.includes("Incident") ? "open incident" : "file"}
                  </button>
                  <button className="sw-btn sw-btn-text" onClick={onFbToggle}><PenLine size={14} /> Adjust</button>
                </>
              )}
              {st === "await" && !n.gotReply && (
                <button className="sw-btn sw-btn-ghost" onClick={() => actions.simulateReply(n.id)}><Clock /> Simulate reply (demo)</button>
              )}
              {st === "settled" && showAdjust && (
                <>
                  <span className="sw-settled-note"><Check size={13} /> {n.sent ? "Sent" : n.gotReply ? "Reply received" : n.filed ? "Filed" : "Verified"}</span>
                  {n.type !== "brief" && <button className="sw-btn sw-btn-text" onClick={onFbToggle}><PenLine size={14} /> Adjust</button>}
                </>
              )}
            </div>

            {fbOpen && (
              <div className="sw-fb">
                <div className="sw-fb-chips">
                  {FB_CHIPS.map((c) => (
                    <button key={c} className="sw-chip" aria-pressed={fbChips.includes(c)}
                      onClick={() => setFbChips(fbChips.includes(c) ? fbChips.filter((x) => x !== c) : [...fbChips, c])}>{c}</button>
                  ))}
                </div>
                <textarea className="sw-ta" rows={2} placeholder="What's off here? Steward recomputes this step and everything after it — verified steps above hold."
                  value={fbText} onChange={(e) => setFbText(e.target.value)} />
                <div className="sw-nact">
                  <button className="sw-btn sw-btn-pri" onClick={onFbSubmit}
                    disabled={fbChips.length === 0 && !fbText.trim()}
                    style={(fbChips.length === 0 && !fbText.trim()) ? { opacity: .45 } : null}>
                    <RotateCw size={14} /> Recompute from here
                  </button>
                  <button className="sw-btn sw-btn-text" onClick={onFbToggle}>Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
}

/* map a display name back to a person id for the reassign avatar (best-effort) */
function ownerIdByName(name) {
  const hit = Object.values(PEOPLE).find((p) => p.name === name);
  return hit ? hit.id : "dmitri";
}
