import React, { useState } from "react";
import { Circle, AlertTriangle, Cpu, Users, DollarSign, Lightbulb, Notebook, Database, RotateCw } from "lucide-react";
import {
  SEED_SOURCES, PEOPLE_SOURCE, FINANCE_SOURCE, BUDGET_LINES, PEOPLE,
  VAULT_INDEX, EMBEDDING_PROVIDERS,
} from "./data.js";
import { Avatar } from "./components.jsx";

/* ============================================================================
   SOURCES — keeps its job (the MCP mesh + the swappable reasoning engine) and
   gains two new inputs: the people/org model and financial data. Reads stay
   permissive; every write surface stays gated inside the Move.
   ========================================================================== */

const CONN = {
  ok:     { c: "var(--green)", t: "Connected" },
  reauth: { c: "var(--amber)", t: "Needs reauth" },
};

export default function Sources({ memory }) {
  const roster = Object.values(PEOPLE).filter((p) => p.id !== "you").slice(0, 6);
  const [embed, setEmbed] = useState(EMBEDDING_PROVIDERS.find((p) => p.active)?.id || EMBEDDING_PROVIDERS[0].id);
  return (
    <>
      <div className="sw-scroll">
        {/* connected sources */}
        <div className="sw-group" style={{ marginTop: 14 }}>
          {SEED_SOURCES.map((s) => {
            const cm = CONN[s.conn]; const Ic = s.ic;
            return (
              <div className="sw-srcrow" key={s.name}>
                <span className="sw-srcic"><Ic size={17} /></span>
                <div className="sw-srcmain">
                  <div className="sw-srcname">{s.name}</div>
                  <div className="sw-srcscope">{s.scope}</div>
                </div>
                <div className="sw-srcmeta">
                  <span className="sw-conn" style={{ color: cm.c }}>
                    {s.conn === "ok" ? <Circle size={8} fill={cm.c} stroke="none" /> : <AlertTriangle size={11} />} {cm.t}
                  </span>
                  <div className="sw-fresh sw-mono">{s.conn === "ok" ? `${s.fresh} · ${s.sig} signals` : s.fresh}</div>
                </div>
                {s.conn === "reauth" && <button className="sw-btn sw-btn-ghost" style={{ marginLeft: 14 }}>Reconnect</button>}
              </div>
            );
          })}
        </div>

        {/* people / org model */}
        <div className="sw-sec-h">People &amp; org model</div>
        <div className="sw-group" style={{ marginTop: 6 }}>
          <div className="sw-srcrow">
            <span className="sw-srcic"><Users size={17} /></span>
            <div className="sw-srcmain">
              <div className="sw-srcname">{PEOPLE_SOURCE.name}</div>
              <div className="sw-srcscope">{PEOPLE_SOURCE.scope}</div>
            </div>
            <div className="sw-srcmeta">
              <span className="sw-conn" style={{ color: "var(--green)" }}><Circle size={8} fill="var(--green)" stroke="none" /> Synced</span>
              <div className="sw-fresh sw-mono">{PEOPLE_SOURCE.fresh}</div>
            </div>
          </div>
          <div className="sw-srcnote">{PEOPLE_SOURCE.note}</div>
          {roster.map((p) => (
            <div className="sw-srcrow" key={p.id}>
              <Avatar id={p.id} size="lg" />
              <div className="sw-srcmain">
                <div className="sw-srcname">{p.name}</div>
                <div className="sw-srcscope">{p.role} · {p.team}</div>
              </div>
              <div className="sw-srcmeta" style={{ maxWidth: 220 }}>
                <div className="sw-fresh" style={{ marginTop: 0 }}>owns {p.owns.join(" · ")}</div>
              </div>
            </div>
          ))}
        </div>

        {/* financial data */}
        <div className="sw-sec-h">Financial data</div>
        <div className="sw-group" style={{ marginTop: 6 }}>
          <div className="sw-srcrow">
            <span className="sw-srcic"><DollarSign size={17} /></span>
            <div className="sw-srcmain">
              <div className="sw-srcname">{FINANCE_SOURCE.name}</div>
              <div className="sw-srcscope">{FINANCE_SOURCE.scope}</div>
            </div>
            <div className="sw-srcmeta">
              <span className="sw-conn" style={{ color: "var(--green)" }}><Circle size={8} fill="var(--green)" stroke="none" /> Synced</span>
              <div className="sw-fresh sw-mono">{FINANCE_SOURCE.fresh}</div>
            </div>
          </div>
          <div className="sw-nums" style={{ margin: "0 18px 14px", borderRadius: 10 }}>
            {BUDGET_LINES.map((b, i) => (
              <div className={"sw-num" + (b.flag ? " flag" : "")} key={i}>
                <span className="sw-num-l">{b.label}</span>
                <span className="sw-num-v sw-mono">{b.value}</span>
                <span className="sw-num-n">{b.note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* vault & retrieval */}
        <div className="sw-sec-h">Vault &amp; retrieval</div>
        <p className="sw-est" style={{ margin: "0 4px 6px" }}>The local Obsidian vault, chunked and embedded so Studio can retrieve from it. Local-first — runs entirely on localhost.</p>
        <div className="sw-group" style={{ marginTop: 0 }}>
          <div className="sw-srcrow">
            <span className="sw-srcic"><Notebook size={17} /></span>
            <div className="sw-srcmain">
              <div className="sw-srcname">Obsidian vault</div>
              <div className="sw-srcscope">{VAULT_INDEX.notes} notes · markdown + arbitrary files · read/write</div>
            </div>
            <div className="sw-srcmeta">
              <span className="sw-conn" style={{ color: "var(--green)" }}><Circle size={8} fill="var(--green)" stroke="none" /> Indexed</span>
              <div className="sw-fresh sw-mono">{VAULT_INDEX.chunks} chunks · {VAULT_INDEX.lastIndexed}</div>
            </div>
            <button className="sw-btn sw-btn-ghost" style={{ marginLeft: 14 }}><RotateCw size={13} /> Re-index</button>
          </div>
          <div className="sw-srcrow">
            <span className="sw-srcic"><Database size={17} /></span>
            <div className="sw-srcmain">
              <div className="sw-srcname">Vector store</div>
              <div className="sw-srcscope">{VAULT_INDEX.db}</div>
            </div>
            <div className="sw-srcmeta"><span className="sw-conn" style={{ color: "var(--green)" }}><Circle size={8} fill="var(--green)" stroke="none" /> Local</span></div>
          </div>
        </div>

        <div className="sw-sec-h">Embedding model</div>
        <div className="sw-group" style={{ marginTop: 0 }}>
          {EMBEDDING_PROVIDERS.map((p) => (
            <button key={p.id} className={"sw-embed" + (embed === p.id ? " on" : "")} onClick={() => setEmbed(p.id)}>
              <span className="sw-embed-radio" />
              <span className="sw-embed-main">
                <span className="sw-embed-name">{p.label}</span>
                <span className="sw-embed-where">{p.where}</span>
              </span>
              <span className="sw-embed-dims sw-mono">{p.dims}d</span>
            </button>
          ))}
        </div>

        {/* reasoning engine */}
        <div className="sw-sec-h">Reasoning engine</div>
        <div className="sw-group" style={{ marginTop: 6 }}>
          <div className="sw-srcrow">
            <span className="sw-srcic"><Cpu size={17} /></span>
            <div className="sw-srcmain">
              <div className="sw-srcname">Anthropic · Claude</div>
              <div className="sw-srcscope">Provider-agnostic — swappable for OpenAI. Drafts and recomputes Moves; never acts on its own.</div>
            </div>
            <div className="sw-srcmeta"><span className="sw-conn" style={{ color: "var(--green)" }}><Circle size={8} fill="var(--green)" stroke="none" /> Active</span></div>
          </div>
        </div>

        {/* cross-Move memory */}
        <div className="sw-sec-h">Cross-Move memory</div>
        <p className="sw-est" style={{ margin: "0 4px 6px" }}>Corrections stick. These persist and feed future reasoning, so delegation and recompute improve instead of resetting.</p>
        <div className="sw-group" style={{ marginTop: 0 }}>
          {memory.map((mem) => (
            <div className="sw-mem" key={mem.id}>
              <span className="sw-mem-ic"><Lightbulb size={15} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sw-mem-t">{mem.text}</div>
                <div className="sw-mem-l">Learned {mem.learned}</div>
              </div>
              <span className="sw-mem-kind">{mem.kind}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
