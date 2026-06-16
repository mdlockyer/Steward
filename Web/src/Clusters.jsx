import React, { useState, useMemo } from "react";
import {
  Search, Pin, Sparkles, Flame, Layers, Users, FileText, Clock, AlertTriangle,
  ChevronLeft, Boxes, Cpu, Scale, Banknote, Map, UsersRound, Ticket, GitBranch,
  Calendar, Check, ChevronRight,
} from "lucide-react";
import { Avatar, AvatarStack, PageHead } from "./components.jsx";
import { CLUSTER_KIND, clusterStats, person, LOOP_TYPE, STATE_META, SEED_ROADMAP } from "./data.js";

/* ============================================================================
   STEWARD — Clusters: the home board. A Cluster groups Objects (loops, people,
   notes, roadmap, meetings). Auto-clusters carry a confidence and must be
   reviewable, because a wrong cluster mis-scopes the model. ALL DATA IS MOCK.
   ========================================================================== */

const GLYPH = { boxes: Boxes, cpu: Cpu, scale: Scale, banknote: Banknote, map: Map, users: UsersRound };
const RM_STATUS = {
  onTrack:  { label: "On track", color: "var(--green)" },
  atRisk:   { label: "At risk",  color: "var(--amber)" },
  slipping: { label: "Slipping", color: "var(--red)"   },
  done:     { label: "Done",     color: "var(--ink-3)" },
};
const rm = (id) => SEED_ROADMAP.find((r) => r.id === id);

/* ------------------------------- the board ------------------------------- */
export default function Clusters({ clusters, loops, vault, onOpen }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clusters;
    return clusters.filter((c) => (c.name + " " + c.summary).toLowerCase().includes(t));
  }, [q, clusters]);

  return (
    <div className="sw-scroll" style={{ paddingTop: 18 }}>
      <PageHead title="Clusters" sub="Your work, grouped — open one to scope everything to it.">
        <div className="cl-search">
          <Search />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clusters…" aria-label="Search clusters" />
          {!q && <kbd>⌘K</kbd>}
        </div>
      </PageHead>

      {filtered.length === 0 ? (
        <div className="sw-empty" style={{ paddingTop: 70 }}>
          <div className="sw-empty-ic"><Boxes size={20} /></div>
          <b>No clusters match “{q}”.</b>
        </div>
      ) : (
        <div className="cl-grid">
          {filtered.map((cl) => (
            <ClusterCard key={cl.id} cl={cl} stats={clusterStats(cl, { loops, vault })} onOpen={() => onOpen(cl.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClusterCard({ cl, stats, onOpen }) {
  const Glyph = GLYPH[cl.glyph] || Boxes;
  return (
    <button className={"cl-card" + (stats.needsReview ? " is-review" : "")} style={{ "--cl": cl.accent }} onClick={onOpen}>
      <div className="cl-card-top">
        <span className="cl-glyph"><Glyph /></span>
        <span className="cl-kind">{CLUSTER_KIND[cl.kind]?.label}</span>
        {cl.pinned && <span className="cl-pin" title="Pinned"><Pin /></span>}
        {cl.auto && <span className={"cl-auto" + (stats.needsReview ? " warn" : "")}><Sparkles /> {cl.confidence}%</span>}
        {stats.hasFire && <span className={"cl-fire" + (cl.auto ? " after" : "")} title="Active fire"><Flame /></span>}
      </div>
      <div className="cl-name">{cl.name}</div>
      <div className="cl-summary">{cl.summary}</div>
      <div className="cl-stats">
        <span><Layers /> {stats.openLoops}</span>
        <span><Users /> {stats.people}</span>
        <span><FileText /> {stats.notes}</span>
        {stats.artifacts > 0 && <span><Ticket /> {stats.artifacts}</span>}
      </div>
      <div className="cl-foot">
        <AvatarStack ids={cl.people.slice(0, 4)} />
        {stats.needsReview
          ? <span className="cl-review"><AlertTriangle /> Review</span>
          : <span className="cl-activity"><Clock /> {cl.activity}</span>}
      </div>
    </button>
  );
}

/* ------------------------------- the detail ------------------------------ */
export function ClusterDetail({ cl, loops, vault, meetings, onBack, onOpenLoop }) {
  const stats = clusterStats(cl, { loops, vault });
  const [tab, setTab] = useState("members");
  const [confirmed, setConfirmed] = useState(false);
  const Glyph = GLYPH[cl.glyph] || Boxes;
  const memberMeetings = (cl.meetings || []).map((id) => meetings.find((m) => m.id === id)).filter(Boolean);

  return (
    <div className="sw-scroll" style={{ paddingTop: 22 }} key={cl.id}>
      <button className="sw-back" onClick={onBack}><ChevronLeft size={17} /> Clusters</button>

      <div className="cl-d-head" style={{ "--cl": cl.accent }}>
        <span className="cl-d-glyph"><Glyph /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cl-d-name">
            {cl.name}
            {stats.hasFire && <span className="cl-fire" title="Active fire"><Flame /></span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 7 }}>
            <span className="sw-typechip">{CLUSTER_KIND[cl.kind]?.label}</span>
            <span className="sw-est">{cl.auto ? "Surfaced by Steward" : "Hand-assembled"} · {stats.total} objects</span>
          </div>
          <p className="cl-d-summary">{cl.summary}</p>
        </div>
      </div>

      {cl.auto && (
        <div className={"cl-gate" + (confirmed || !stats.needsReview ? " ok" : "")}>
          <span className="cl-gate-ic">{confirmed ? <Check size={17} /> : stats.needsReview ? <AlertTriangle size={17} /> : <Sparkles size={17} />}</span>
          <div className="cl-gate-main">
            <div className="cl-gate-t">
              {confirmed ? "Cluster confirmed" : stats.needsReview ? "Steward isn't sure these belong together" : "Steward grouped these"}
            </div>
            <div className="cl-gate-s">
              {confirmed
                ? "Steward will keep this scope and learn from it."
                : `${cl.confidence}% confident · a wrong cluster mis-scopes Steward, so confirm or adjust before relying on it.`}
            </div>
          </div>
          {!confirmed && (
            <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
              <button className="sw-btn sw-btn-pri" onClick={() => setConfirmed(true)}><Check /> Looks right</button>
              <button className="sw-btn sw-btn-text">Adjust members</button>
            </div>
          )}
        </div>
      )}

      <div className="sw-seg" style={{ margin: "18px 0 2px" }}>
        <button aria-pressed={tab === "members"} onClick={() => setTab("members")}>Members <span className="sw-seg-n">{stats.total}</span></button>
        <button aria-pressed={tab === "artifacts"} onClick={() => setTab("artifacts")}>Artifacts <span className="sw-seg-n">{stats.artifacts}</span></button>
      </div>

      {tab === "members" ? (
        <>
          {stats.memberLoops.length > 0 && (
            <Section icon={Layers} label="Open loops" n={stats.memberLoops.length}>
              {stats.memberLoops.map((l) => <LoopRow key={l.id} l={l} onOpen={() => onOpenLoop(l.id)} />)}
            </Section>
          )}

          {(cl.roadmap || []).length > 0 && (
            <Section icon={GitBranch} label="Roadmap" n={cl.roadmap.length}>
              {cl.roadmap.map(rm).filter(Boolean).map((r) => {
                const st = RM_STATUS[r.status] || RM_STATUS.onTrack;
                return (
                  <button className="cl-mrow" key={r.id} onClick={() => r.loopId && onOpenLoop(r.loopId)}>
                    <span className="cl-mglyph"><GitBranch /></span>
                    <span className="cl-mmain">
                      <span className="cl-mtitle">{r.name}</span>
                      <span className="cl-mmeta">{r.date} · owner {person(r.owner).name.split(" ")[0]}</span>
                    </span>
                    <span className="cl-mright">
                      <span className="sw-rm-status" style={{ color: st.color }}>
                        <span className="sw-sevdot" style={{ background: st.color, boxShadow: "none" }} />{st.label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </Section>
          )}

          {(cl.people || []).length > 0 && (
            <Section icon={Users} label="People" n={cl.people.length}>
              <div className="cl-people-grid">
                {cl.people.map((id) => {
                  const p = person(id);
                  return (
                    <div className="cl-person" key={id}>
                      <Avatar id={id} />
                      <span style={{ minWidth: 0 }}>
                        <span className="cl-person-n">{p.name}</span>
                        <span className="cl-person-r">{p.role || "—"}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {stats.memberNotes.length > 0 && (
            <Section icon={FileText} label="Notes" n={stats.memberNotes.length}>
              {stats.memberNotes.map((v) => (
                <div className="cl-mrow" key={v.id}>
                  <span className="cl-mglyph"><FileText /></span>
                  <span className="cl-mmain">
                    <span className="cl-mtitle">{v.name}</span>
                    <span className="cl-mmeta">Vault · updated {v.updated || "recently"}</span>
                  </span>
                  <span className="cl-mright"><ChevronRight size={16} style={{ color: "var(--ink-3)" }} /></span>
                </div>
              ))}
            </Section>
          )}

          {memberMeetings.length > 0 && (
            <Section icon={Calendar} label="Meetings" n={memberMeetings.length}>
              {memberMeetings.map((m) => (
                <div className="cl-mrow" key={m.id}>
                  <span className="cl-mglyph"><Calendar /></span>
                  <span className="cl-mmain">
                    <span className="cl-mtitle">{m.title}</span>
                    <span className="cl-mmeta">{m.when || "Scheduled"}</span>
                  </span>
                </div>
              ))}
            </Section>
          )}
        </>
      ) : (
        stats.artifacts > 0 ? (
          <Section icon={Ticket} label="Produced by this cluster" n={stats.artifacts}>
            {cl.artifactList.map((a, i) => (
              <div className="cl-art" key={i}>
                <span className="cl-art-ic"><Ticket size={16} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="cl-art-t">{a.title}</span>
                  <span className="cl-art-k">{a.kind} · {a.when}</span>
                </span>
                <ChevronRight size={16} style={{ color: "var(--ink-3)" }} />
              </div>
            ))}
          </Section>
        ) : (
          <div className="sw-empty" style={{ paddingTop: 50 }}>
            <div className="sw-empty-ic"><Ticket size={20} /></div>
            <b>No artifacts yet.</b>
            <span style={{ display: "block", marginTop: 4, fontSize: 13 }}>Tickets, pages, and decks this cluster produces will land here.</span>
          </div>
        )
      )}
    </div>
  );
}

function Section({ icon: Icon, label, n, children }) {
  return (
    <>
      <div className="sw-group-h"><Icon size={13} /> {label} <span className="sw-gh-n">{n}</span></div>
      <div className="sw-group" style={{ marginTop: 8 }}>{children}</div>
    </>
  );
}

function LoopRow({ l, onOpen }) {
  const T = LOOP_TYPE[l.type] || { ic: Layers, color: "var(--ink-2)" };
  const Ic = T.ic;
  const st = STATE_META[l.state] || { label: l.state, color: "var(--ink-2)" };
  const cp = person(l.counterparty);
  return (
    <button className="cl-mrow" onClick={onOpen}>
      <span className="cl-mglyph" style={{ color: T.color }}><Ic /></span>
      <span className="cl-mmain">
        <span className="cl-mtitle">{l.title}</span>
        <span className="cl-mmeta">
          <span className="sw-with"><Avatar id={cp.id} size="sm" /> {cp.name.split(" ")[0]}</span>
          <span style={{ color: "var(--ink-3)", opacity: 0.6 }}>·</span>
          <span style={{ color: st.color, fontWeight: 600 }}>{st.label}</span>
        </span>
      </span>
      <span className="cl-mright">
        <span className="sw-age">{l.age}</span>
        <ChevronRight size={16} style={{ color: "var(--ink-3)" }} />
      </span>
    </button>
  );
}
