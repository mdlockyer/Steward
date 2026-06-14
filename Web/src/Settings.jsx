import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Plug, Plus, Check, Trash2, KeyRound, Sparkles, Server, AlertTriangle } from "lucide-react";

/* ============================================================================
   SETTINGS — server-backed configuration. Talks to /api/settings (GET to read,
   POST actions to mutate). Keys are stored server-side and never returned to the
   browser (only a hasKey flag). Providers section is live now; MCP and Files
   sections land with those features.
   ========================================================================== */

const SETTINGS_CSS = `
.se-backdrop{position:fixed;inset:0;background:rgba(20,20,24,.34);backdrop-filter:blur(2px);
  display:grid;place-items:center;z-index:200;padding:24px;animation:se-fade .16s ease both}
@keyframes se-fade{from{opacity:0}to{opacity:1}}
.se-panel{width:100%;max-width:660px;max-height:84vh;background:var(--canvas);border:1px solid var(--hair);
  border-radius:18px;box-shadow:var(--sh-pop);display:flex;flex-direction:column;overflow:hidden;
  animation:se-rise .2s cubic-bezier(.2,.8,.2,1) both}
@keyframes se-rise{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:none}}
.se-head{display:flex;align-items:center;gap:11px;padding:18px 20px;border-bottom:1px solid var(--hair);background:var(--surface)}
.se-head h2{font-size:17px;font-weight:600;letter-spacing:-0.02em;margin:0}
.se-head .se-sub{font-size:12px;color:var(--ink-3);margin-top:2px}
.se-x{margin-left:auto;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--ink-3)}
.se-x:hover{background:rgba(0,0,0,.06);color:var(--ink)}
.se-body{padding:18px 20px 22px;overflow-y:auto}
.se-body::-webkit-scrollbar{width:9px}.se-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.14);border-radius:9px;border:2px solid var(--canvas)}
.se-sec{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3);margin:6px 2px 10px;display:flex;align-items:center;gap:7px}
.se-note{font-size:12px;color:var(--ink-2);line-height:1.5;margin:0 2px 14px}

.se-prov{border:1px solid var(--hair);border-radius:13px;background:var(--surface);box-shadow:var(--sh-1);margin-bottom:11px;overflow:hidden}
.se-prov-top{display:flex;align-items:center;gap:11px;padding:12px 14px}
.se-prov-ic{width:30px;height:30px;border-radius:8px;background:var(--surface-2);border:1px solid var(--hair);display:grid;place-items:center;color:var(--ink-2);flex:0 0 auto}
.se-prov-main{flex:1;min-width:0}
.se-prov-name{font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px}
.se-prov-meta{font-size:11.5px;color:var(--ink-3);margin-top:2px;font-family:var(--mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.se-badge{font-size:10px;font-weight:700;letter-spacing:.03em;padding:2px 6px;border-radius:5px;text-transform:uppercase}
.se-badge.kind{background:rgba(0,0,0,.05);color:var(--ink-2)}
.se-badge.ok{background:var(--green-soft);color:var(--green)}
.se-badge.no{background:var(--amber-soft);color:var(--amber)}
.se-default{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-2);font-weight:500;cursor:pointer;flex:0 0 auto}
.se-default input{accent-color:var(--accent)}
.se-prov-edit{border-top:1px solid var(--hair-2);padding:11px 14px;display:flex;flex-direction:column;gap:9px;background:var(--surface-2)}
.se-field{display:flex;align-items:center;gap:9px}
.se-field label{font-size:11.5px;color:var(--ink-3);font-weight:600;width:62px;flex:0 0 auto}
.se-inp{flex:1;border:1px solid var(--hair);border-radius:8px;padding:7px 10px;font-family:var(--ui);font-size:13px;color:var(--ink);background:var(--surface);min-width:0}
.se-inp:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.se-inp.mono{font-family:var(--mono);font-size:12px}
.se-row-actions{display:flex;gap:7px;flex-wrap:wrap}

.se-add{border:1px dashed var(--hair);border-radius:13px;padding:14px;background:var(--surface-2)}
.se-add .se-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:9px}
.se-add .se-full{grid-column:1 / -1}
.se-err{font-size:12.5px;color:var(--red);font-weight:500;margin:0 2px 12px;display:flex;gap:7px;align-items:center}
.se-soon{border:1px solid var(--hair);border-radius:12px;padding:13px 14px;background:var(--surface);color:var(--ink-3);font-size:12.5px;display:flex;align-items:center;gap:9px;margin-bottom:11px}
.se-oauth{border:1px solid rgba(10,109,255,.25);background:var(--accent-soft);border-radius:13px;padding:13px 14px;margin-bottom:12px;display:flex;align-items:center;gap:14px}
.se-oauth b{font-size:13.5px;font-weight:600}
.se-oauth p{font-size:12px;color:var(--ink-2);margin:4px 0 0;line-height:1.5}
.se-oauth p em{color:var(--amber);font-style:normal;font-weight:600}
.se-oauth button{flex:0 0 auto}
.se-chip{font-size:11.5px;font-family:var(--mono);border:1px solid var(--hair);border-radius:7px;padding:4px 8px;background:var(--surface);color:var(--ink-2);cursor:pointer;transition:.12s}
.se-chip:hover{border-color:var(--accent);color:var(--accent)}
.se-chip[aria-pressed="true"]{border-color:var(--accent);color:var(--accent);background:var(--accent-soft);font-weight:600}
`;

const PROVIDER_ICON = { anthropic: Sparkles, openai: Server };

export default function Settings({ onClose }) {
  const [data, setData] = useState(null);   // { providers:[...], defaultProvider }
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (document.getElementById("se-styles")) return;
    const el = document.createElement("style"); el.id = "se-styles"; el.textContent = SETTINGS_CSS; document.head.appendChild(el);
  }, []);

  const load = useCallback(async () => {
    try { const r = await fetch("/api/settings"); if (!r.ok) throw new Error(); setData(await r.json()); setErr(null); }
    catch { setErr("Couldn't reach the settings backend — make sure the dev server is running (npm run dev)."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const act = useCallback(async (body) => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Request failed");
      setData(j);
    } catch (e) { setErr(String(e.message || e)); }
    finally { setBusy(false); }
  }, []);

  // "Sign in with ChatGPT": open the OAuth window, then poll until the token lands.
  const signInChatGPT = useCallback(async () => {
    setOauthBusy(true); setErr(null);
    try {
      const r = await fetch("/api/auth/openai/start", { method: "POST" });
      const j = await r.json();
      if (!r.ok || !j.authorizeUrl) throw new Error(j.error || "Couldn't start sign-in");
      window.open(j.authorizeUrl, "_blank", "noopener");
      const started = Date.now();
      const poll = setInterval(async () => {
        try {
          const s = await (await fetch("/api/settings")).json();
          const p = (s.providers || []).find((x) => x.id === "openai-chatgpt");
          if (p && p.hasKey) { clearInterval(poll); setData(s); setOauthBusy(false); }
          else if (Date.now() - started > 180000) { clearInterval(poll); setOauthBusy(false); setErr("Sign-in timed out — try again."); }
        } catch { /* keep polling */ }
      }, 2000);
    } catch (e) { setErr(String(e.message || e)); setOauthBusy(false); }
  }, []);

  const providers = (data && data.providers) || [];

  return (
    <div className="se-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="se-panel" ref={panelRef} role="dialog" aria-modal="true" aria-label="Settings">
        <div className="se-head">
          <Plug size={18} />
          <div>
            <h2>Settings</h2>
            <div className="se-sub">Providers &amp; keys · stored locally on the server</div>
          </div>
          <button className="se-x" onClick={onClose} aria-label="Close settings"><X size={17} /></button>
        </div>

        <div className="se-body">
          {err && <div className="se-err"><AlertTriangle size={14} /> {err}</div>}

          <div className="se-sec"><KeyRound size={13} /> Model providers</div>
          <p className="se-note">
            Claude and OpenAI are built in. Add any OpenAI-compatible Chat Completions endpoint
            (OpenRouter, Together, Groq, Ollama, LM Studio, vLLM…) by base URL — it must support
            tool/function calling for Steward to drive it. Keys stay on the server.
          </p>

          {!providers.some((p) => p.id === "openai-chatgpt" && p.hasKey) && (
            <div className="se-oauth">
              <div>
                <b>Use your ChatGPT plan</b>
                <p>Sign in with ChatGPT to drive Steward with your Plus/Pro/Team subscription — no API key. <em>Experimental: reverse-engineered, undocumented, ToS gray area.</em></p>
              </div>
              <button className="sw-btn sw-btn-pri" onClick={signInChatGPT} disabled={oauthBusy}>
                <Sparkles size={14} /> {oauthBusy ? "Waiting…" : "Sign in with ChatGPT"}
              </button>
            </div>
          )}

          {providers.map((p) => (
            <ProviderRow key={p.id} p={p} busy={busy} act={act} />
          ))}

          <AddProvider busy={busy} act={act} />

          <div className="se-sec" style={{ marginTop: 22 }}><Server size={13} /> MCP servers</div>
          <div className="se-soon"><Server size={15} /> Connect Filesystem and other MCP servers — arriving in the next pass.</div>

          <div className="se-sec" style={{ marginTop: 18 }}><Plus size={13} /> Files</div>
          <div className="se-soon"><Plus size={15} /> Image / PDF / zip upload settings — arriving with file support.</div>
        </div>
      </div>
    </div>
  );
}

function ProviderRow({ p, busy, act }) {
  const [keyVal, setKeyVal] = useState("");
  const [model, setModel] = useState(p.model || "");
  const [editingKey, setEditingKey] = useState(!p.hasKey);
  const Ic = PROVIDER_ICON[p.id] || Server;
  const isOAuth = p.kind === "openai-oauth";
  const [models, setModels] = useState(null);
  const [modelsBusy, setModelsBusy] = useState(false);

  useEffect(() => { setModel(p.model || ""); }, [p.model]);

  const loadModels = async () => {
    setModelsBusy(true);
    try {
      const r = await fetch("/api/providers/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setModels(j.models || []);
    } catch { setModels([]); }
    finally { setModelsBusy(false); }
  };

  return (
    <div className="se-prov">
      <div className="se-prov-top">
        <span className="se-prov-ic"><Ic size={16} /></span>
        <div className="se-prov-main">
          <div className="se-prov-name">
            {p.label}
            <span className="se-badge kind">{p.kind === "anthropic" ? "Anthropic" : "Chat"}</span>
            {p.hasKey ? <span className="se-badge ok">Key set</span> : <span className="se-badge no">No key</span>}
          </div>
          <div className="se-prov-meta">{p.baseURL || (p.kind === "anthropic" ? "api.anthropic.com" : "api.openai.com")}{p.model ? ` · ${p.model}` : ""}</div>
        </div>
        <label className="se-default">
          <input type="radio" name="se-default" checked={!!p.isDefault} onChange={() => act({ action: "setDefault", id: p.id })} disabled={busy} />
          Default
        </label>
      </div>

      <div className="se-prov-edit">
        <div className="se-field">
          <label>{isOAuth ? "Account" : "API key"}</label>
          {isOAuth ? (
            <>
              <span className="se-inp" style={{ color: p.hasKey ? "var(--green)" : "var(--ink-3)" }}>{p.hasKey ? "Signed in via ChatGPT" : "Not signed in"}</span>
              {p.hasKey && <button className="sw-btn sw-btn-text" style={{ color: "var(--red)" }} disabled={busy} onClick={() => act({ action: "removeProvider", id: p.id })}>Sign out</button>}
            </>
          ) : (p.hasKey && !editingKey) ? (
            <>
              <span className="se-inp" style={{ color: "var(--ink-3)", letterSpacing: ".15em" }}>•••••••••• set</span>
              <button className="sw-btn sw-btn-ghost" disabled={busy} onClick={() => setEditingKey(true)}>Replace</button>
              <button className="sw-btn sw-btn-text" style={{ color: "var(--red)" }} disabled={busy} onClick={() => act({ action: "clearKey", id: p.id })}>Clear</button>
            </>
          ) : (
            <>
              <input className="se-inp mono" type="password" placeholder={p.kind === "anthropic" ? "sk-ant-…" : "sk-… (or any token; use a placeholder for local servers)"}
                value={keyVal} onChange={(e) => setKeyVal(e.target.value)} />
              <button className="sw-btn sw-btn-pri" disabled={busy || !keyVal.trim()}
                onClick={() => { act({ action: "setKey", id: p.id, apiKey: keyVal.trim() }); setKeyVal(""); setEditingKey(false); }}>
                <Check size={14} /> Save
              </button>
              {p.hasKey && <button className="sw-btn sw-btn-text" disabled={busy} onClick={() => { setEditingKey(false); setKeyVal(""); }}>Cancel</button>}
            </>
          )}
        </div>

        <div className="se-field">
          <label>Model</label>
          <input className="se-inp mono" value={model} onChange={(e) => setModel(e.target.value)} placeholder="model id" />
          <button className="sw-btn sw-btn-ghost" disabled={busy || model === (p.model || "")}
            onClick={() => act({ action: "setModel", id: p.id, model: model.trim() })}>Save</button>
          {isOAuth && (
            <button className="sw-btn sw-btn-ghost" disabled={modelsBusy} onClick={loadModels}>{modelsBusy ? "Loading…" : "Load models"}</button>
          )}
          {!p.builtin && !isOAuth && (
            <button className="sw-btn sw-btn-text" style={{ color: "var(--red)" }} disabled={busy}
              onClick={() => act({ action: "removeProvider", id: p.id })}><Trash2 size={14} /> Remove</button>
          )}
        </div>
        {isOAuth && models && (
          <div className="se-field" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
            <label>Pick</label>
            {models.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
                {models.map((m) => (
                  <button key={m} className="se-chip" aria-pressed={m === model}
                    onClick={() => { setModel(m); act({ action: "setModel", id: p.id, model: m }); }}>{m}</button>
                ))}
              </div>
            ) : <span style={{ fontSize: 12, color: "var(--ink-3)" }}>No models returned — check the dev terminal for details.</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function AddProvider({ busy, act }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ id: "", label: "", baseURL: "", model: "", apiKey: "" });
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const valid = /^[a-z0-9_-]+$/i.test(f.id) && f.baseURL.trim() && f.model.trim();

  if (!open) return (
    <button className="sw-btn sw-btn-ghost" style={{ marginTop: 4 }} onClick={() => setOpen(true)}><Plus size={15} /> Add a Chat Completions provider</button>
  );

  return (
    <div className="se-add">
      <div className="se-grid">
        <input className="se-inp" placeholder="id (e.g. openrouter)" value={f.id} onChange={up("id")} />
        <input className="se-inp" placeholder="Label (e.g. OpenRouter)" value={f.label} onChange={up("label")} />
        <input className="se-inp mono se-full" placeholder="Base URL (e.g. https://openrouter.ai/api/v1)" value={f.baseURL} onChange={up("baseURL")} />
        <input className="se-inp mono" placeholder="Model id" value={f.model} onChange={up("model")} />
        <input className="se-inp mono" type="password" placeholder="API key (or placeholder for local)" value={f.apiKey} onChange={up("apiKey")} />
      </div>
      <div className="se-row-actions">
        <button className="sw-btn sw-btn-pri" disabled={busy || !valid}
          onClick={() => { act({ action: "addProvider", provider: { ...f, id: f.id.trim(), label: f.label.trim() || f.id.trim() } }); setF({ id: "", label: "", baseURL: "", model: "", apiKey: "" }); setOpen(false); }}>
          <Check size={14} /> Add provider
        </button>
        <button className="sw-btn sw-btn-text" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
