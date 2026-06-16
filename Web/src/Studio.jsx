import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Radio, Link2, Search, MessageSquare, Clock, Ticket, Check, RotateCw,
  Send, PenLine, X, ArrowUp, Sparkles, CircleDot, Plug, CornerDownLeft, ChevronDown,
  FileText, Notebook, Users, AlertTriangle, ArrowRight,
} from "lucide-react";

/* ============================================================================
   STUDIO — the AI collaboration vein. A chat where the unit of work is a Move.
   The model's real tool calls render inline as Steward spine nodes, so the
   conversation literally IS the forming Move. Write actions pause for approval.
   Talks to /api/chat (real Anthropic loop). Falls back to a simulated
   walkthrough when no API key is configured, so the UI is always explorable.
   ========================================================================== */

const STUDIO_CSS = `
.st-wrap{display:flex;flex-direction:column;height:100%;min-height:0}
.st-stream{flex:1;overflow-y:auto;padding:20px 36px 20px;position:relative}
.st-stream.is-empty{display:grid;place-items:center}
.st-stream::-webkit-scrollbar{width:9px}.st-stream::-webkit-scrollbar-thumb{background:rgba(0,0,0,.14);border-radius:9px;border:2px solid var(--canvas)}
.st-rail{position:absolute;left:55px;top:22px;bottom:22px;width:2px;background:linear-gradient(180deg,var(--hair),var(--hair-2));z-index:0}
.st-row{position:relative;margin:0 0 16px;z-index:1}
.st-row:last-child{margin-bottom:2px}

/* user + assistant prose */
.st-user{display:flex;justify-content:flex-end}
.st-user div{background:var(--accent);color:#fff;border-radius:14px 14px 4px 14px;padding:9px 13px;font-size:13.5px;
  line-height:1.5;max-width:74%;box-shadow:var(--sh-1)}
.st-say{padding-left:40px;position:relative;font-size:14px;line-height:1.6;color:var(--ink);max-width:680px;white-space:pre-wrap}
.st-say::before{content:"";position:absolute;left:12px;top:1px;width:16px;height:16px;border-radius:6px;
  background:linear-gradient(160deg,#1d1d1f,#3a3a3e);box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
.st-say .st-cursor{display:inline-block;width:7px;height:14px;background:var(--accent);margin-left:2px;
  border-radius:1px;vertical-align:-2px;animation:st-blink 1s steps(2) infinite}
@keyframes st-blink{50%{opacity:0}}

/* node on the rail */
.st-node{padding-left:40px;position:relative}
.st-node .sw-card{transition:box-shadow .2s,border-color .2s,opacity .25s}
.st-dot{position:absolute;left:8px;top:14px;width:24px;height:24px;border-radius:50%;background:var(--surface);
  border:2px solid var(--hair);display:grid;place-items:center;color:var(--ink-3);z-index:2;box-shadow:var(--sh-1)}
.st-dot svg{width:12px;height:12px}
.st-node[data-st="running"] .st-dot{border-color:var(--accent);color:var(--accent)}
.st-node[data-st="running"] .st-dot svg{animation:sw-spin 1s linear infinite}
.st-node[data-st="settled"] .st-dot{border-color:var(--accent);background:var(--accent);color:#fff}
.st-node[data-st="gate"] .st-dot{border-color:var(--amber);color:var(--amber);box-shadow:0 0 0 4px var(--amber-soft)}
.st-node[data-st="gate"] .sw-card{border-color:rgba(176,106,0,.32);box-shadow:var(--sh-2)}
.st-node[data-st="declined"] .st-dot{border-color:var(--red);color:var(--red)}
.st-node[data-st="declined"] .sw-card{opacity:.6}
.st-node[data-st="done"] .st-dot{border-color:var(--green);background:var(--green);color:#fff}

.st-declined-note{font-size:11.5px;color:var(--red);font-weight:600;display:inline-flex;align-items:center;gap:5px;margin-top:6px}
.st-settled-note{font-size:11.5px;color:var(--green);font-weight:600;display:inline-flex;align-items:center;gap:5px}

/* adjust box inside a gate node */
.st-adjust{margin-top:10px}
.st-adjust textarea{width:100%;border:1px solid var(--hair);border-radius:9px;padding:9px 11px;font-family:inherit;
  font-size:13px;line-height:1.5;resize:vertical;color:var(--ink);background:var(--surface-2)}
.st-adjust textarea:focus{outline:none;border-color:var(--accent);background:var(--surface)}

/* header */
.st-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 32px 10px;min-height:30px}
.st-head .sw-h1{font-size:26px;font-weight:600;letter-spacing:-0.025em}
.st-head .sw-sub{font-size:13.5px;color:var(--ink-2);margin-top:5px;max-width:560px}
.st-head-actions{display:flex;align-items:center;gap:10px;flex:0 0 auto}
.st-model{font-size:11.5px;font-weight:600;color:var(--ink-2);display:inline-flex;align-items:center;gap:6px;
  border:1px solid var(--hair);border-radius:20px;padding:5px 11px;background:var(--surface)}
.st-model .st-live{width:7px;height:7px;border-radius:50%;background:var(--green)}
.st-model.sim .st-live{background:var(--amber)}
.st-switch{position:relative}
.st-switch-btn{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:600;color:var(--ink-2);
  border:1px solid var(--hair);border-radius:20px;padding:5px 9px 5px 11px;background:var(--surface);cursor:pointer;transition:.12s}
.st-switch-btn:hover{border-color:var(--ink-3);color:var(--ink)}
.st-switch-btn .st-live{width:7px;height:7px;border-radius:50%;background:var(--green)}
.st-switch-btn .st-chev{color:var(--ink-3);transition:transform .15s}
.st-switch-btn[aria-expanded="true"] .st-chev{transform:rotate(180deg)}
.st-switch-menu{position:absolute;top:calc(100% + 6px);right:0;min-width:216px;background:var(--surface);
  border:1px solid var(--hair);border-radius:13px;box-shadow:var(--sh-pop);padding:5px;z-index:60;animation:st-pop .14s ease both}
@keyframes st-pop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.st-switch-item{display:flex;align-items:center;gap:9px;width:100%;text-align:left;padding:8px 9px;border-radius:9px;
  font-size:13px;font-weight:500;color:var(--ink);background:none;border:none;cursor:pointer}
.st-switch-item:hover{background:rgba(0,0,0,.05)}
.st-switch-item[aria-selected="true"]{font-weight:600}
.st-switch-check{width:14px;display:inline-flex;color:var(--accent);flex:0 0 auto}
.st-switch-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.st-switch-tag{font-size:9.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--amber);background:var(--amber-soft);padding:2px 6px;border-radius:5px;flex:0 0 auto}

/* composer */
.st-composer{padding:12px 32px 22px;border-top:1px solid var(--hair);background:var(--surface-2)}
.st-inputwrap{display:flex;align-items:flex-end;gap:9px;background:var(--surface);border:1px solid var(--hair);
  border-radius:16px;padding:8px 8px 8px 15px;box-shadow:var(--sh-1)}
.st-inputwrap:focus-within{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}
.st-input{flex:1;border:none;outline:none;resize:none;background:none;font-family:inherit;font-size:14px;
  line-height:1.5;color:var(--ink);max-height:140px;padding:5px 0}
.st-send{width:36px;height:36px;border-radius:11px;background:var(--accent);color:#fff;display:grid;place-items:center;
  flex:0 0 auto;box-shadow:var(--sh-1);transition:.12s}
.st-send:disabled{opacity:.4;cursor:default}.st-send:not(:disabled):hover{filter:brightness(1.07)}
.st-hint{font-size:11px;color:var(--ink-3);margin:8px 2px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.st-chip{font-size:11.5px;color:var(--ink-2);border:1px solid var(--hair);border-radius:16px;padding:5px 10px;background:var(--surface);transition:.12s}
.st-chip:hover{border-color:var(--accent);color:var(--accent)}

/* notices */
.st-notice{margin:8px 0 14px;border:1px solid rgba(176,106,0,.3);background:var(--amber-soft);border-radius:12px;padding:13px 15px}
.st-notice b{font-size:13.5px;font-weight:600}
.st-notice p{font-size:12.5px;color:var(--ink-2);margin:5px 0 0;line-height:1.5}
.st-notice code{font-family:var(--mono);font-size:12px;background:rgba(0,0,0,.06);padding:1px 5px;border-radius:4px}
.st-err{margin:8px 0 14px;border:1px solid var(--red-soft);background:var(--red-soft);border-radius:12px;padding:11px 14px;font-size:12.5px;color:var(--red);font-weight:500;max-height:200px;overflow:auto;white-space:pre-wrap;word-break:break-word}

/* intro empty state */
.st-intro{max-width:540px;margin:30px auto;text-align:center;color:var(--ink-2)}
.st-intro .st-orb{width:50px;height:50px;border-radius:15px;background:linear-gradient(160deg,#1d1d1f,#3a3a3e);
  display:grid;place-items:center;margin:0 auto 16px;box-shadow:var(--sh-2)}
.st-intro h2{font-size:19px;font-weight:600;color:var(--ink);letter-spacing:-0.02em;margin:0 0 7px}
.st-intro p{font-size:13.5px;line-height:1.55;margin:0 auto;max-width:430px}
.st-starts{display:flex;flex-direction:column;gap:8px;margin-top:20px;text-align:left}
.st-start{display:flex;align-items:center;gap:11px;border:1px solid var(--hair);background:var(--surface);
  border-radius:12px;padding:12px 14px;box-shadow:var(--sh-1);transition:.12s}
.st-start:hover{border-color:var(--accent);box-shadow:var(--sh-2)}
.st-start svg{color:var(--accent);flex:0 0 auto}
.st-start span{font-size:13.5px;color:var(--ink);font-weight:500;text-align:left}
`;

const NODE_ICON = { observe: Radio, connect: Link2, retrieve: Search, send: MessageSquare, await: Clock, create: Ticket, assess: AlertTriangle, route: Users, compose: FileText, brief: FileText };
const NODE_LABEL = { observe: "Observe", connect: "Connect", retrieve: "Retrieve", send: "Draft & send", await: "Await reply", create: "Create artifact", assess: "Assess severity", route: "Route to owner", compose: "Compose", brief: "Brief" };

const STARTERS = [
  "The M-series test rigs are thermal-throttling — can you sort it?",
  "What did we decide about the codec? Check the vault.",
  "Turn yesterday's design retro into action items with owners.",
];

/* ----------------------- crystallize a chat into a Move ------------------- */
function buildMove(rows, seedTitle) {
  const nodeRows = rows.filter((r) => r.kind === "node" && r.status !== "declined");
  const firstUser = rows.find((r) => r.kind === "user");
  const title = seedTitle || (firstUser ? firstUser.text.replace(/\s+/g, " ").slice(0, 64) : "Untitled Move");
  const nodes = nodeRows.map((r, i) => {
    const n = { id: r.id || "n" + i, ...r.node };
    n.status = r.status === "gate" ? "gate" : "settled";
    if (n.type === "await" && n.reply) { n.gotReply = true; }
    if (n.type === "send" && r.status === "settled") { n.sent = true; }
    return n;
  });
  const srcs = [...new Set(nodeRows.flatMap((r) => r.node.srcs || []).map((s) => s.split(" · ")[0].split(" ")[0]))].slice(0, 4);
  const createNode = [...nodeRows].reverse().find((r) => r.node.type === "create");
  const terminal = createNode ? `${createNode.node.ticket.project} ${createNode.node.ticket.type}` : "Move";
  const confs = nodeRows.map((r) => r.node.conf).filter((c) => typeof c === "number");
  const conf = confs.length ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length) : 80;
  return { id: "chat-" + Date.now(), status: "review", title,
    line: "Worked live in Studio → " + nodeRows.map((r) => NODE_LABEL[r.node.type].toLowerCase()).join(" → ") + ".",
    srcs: srcs.length ? srcs : ["Studio"], conf, terminal, fromChat: true, nodes };
}

/* ------------------------------ sim walkthrough --------------------------- */
/* Played through the SAME event pipeline as the live stream, split into
   segments at each approval gate. Lets the demo run with no API key. */
const SIM = [
  [ { t: 300, e: { type: "text_delta", text: "First, let me check the vault for anything we've already written on this." } },
    { t: 450, e: { type: "assistant_message", text: "First, let me check the vault for anything we've already written on this.", toolCalls: [{ id: "v0", name: "search_vault", input: { query: "rig thermal throttling pad standard" } }] } },
    { t: 520, e: { type: "tool_result", id: "v0", name: "search_vault", node: { type: "retrieve", conf: 88, title: "Searched the vault — 2 relevant notes", retrieved: [{ note: "Thermal throttling", score: 0.91, snippet: "M-series rigs thermal-throttle on long capture runs; the fix was a thermal pad." }, { note: "Thermal pad standard", score: 0.88, snippet: "We standardize on Arctic thermal pads." }], srcs: ["Vault · RAG"] } } },
    { t: 350, e: { type: "text_delta", text: "Good — the vault confirms our Arctic standard. Now let me ground this in what people actually said." } },
    { t: 500, e: { type: "assistant_message", text: "Good — the vault confirms our Arctic standard. Now let me ground this in what people actually said.", toolCalls: [{ id: "s1", name: "read_source", input: { source: "granola", query: "rig thermal throttle perf" } }] } },
    { t: 400, e: { type: "tool_result", id: "s1", name: "read_source", node: { type: "observe", conf: 92, title: "Read granola", body: "Standup (today): Priya said the M-series test rigs are thermal-throttling on long capture runs, skewing the perf numbers the team reports.", srcs: ["Granola · standup notes"] } } },
    { t: 700, e: { type: "text_delta", text: "This rings a bell — checking for a prior thread before I reinvent a fix." } },
    { t: 500, e: { type: "assistant_message", text: "This rings a bell — checking for a prior thread before I reinvent a fix.", toolCalls: [{ id: "s2", name: "find_related", input: { topic: "rig thermal throttling" } }] } },
    { t: 450, e: { type: "tool_result", id: "s2", name: "find_related", node: { type: "connect", conf: 85, title: "Linked a related thread", body: "Dmitri's #hw-platform thread (~3 weeks ago) describes the same throttling. Its conclusion: a higher-conductivity thermal pad fixed it. Never formally resolved.", srcs: ["Slack · #hw-platform"] } } },
    { t: 700, e: { type: "text_delta", text: "Their fix was a thermal pad. Matching that to the rig spec and pulling buyable options." } },
    { t: 500, e: { type: "assistant_message", text: "Their fix was a thermal pad. Matching that to the rig spec and pulling buyable options.", toolCalls: [{ id: "s3", name: "find_parts", input: { spec: "2.0 mm thermal pad" } }] } },
    { t: 450, e: { type: "tool_result", id: "s3", name: "find_parts", node: { type: "retrieve", conf: 74, title: "Found matching options", parts: [{ name: "Thermalright Odyssey", spec: "2.0 mm · 12.8 W/mK", price: "$11" }, { name: "Arctic TP-3", spec: "2.0 mm · 12.5 W/mK", price: "$16" }], srcs: ["Amazon"] } } },
    { t: 750, e: { type: "text_delta", text: "I'd confirm the pick with Priya before ordering. Here's a draft DM — your call to send it." } },
    { t: 550, e: { type: "assistant_message", text: "I'd confirm the pick with Priya before ordering. Here's a draft DM — your call to send it.", toolCalls: [{ id: "s4", name: "draft_and_send", input: { to: "Priya Menon · Slack DM", message: "Hey Priya — re: the rig throttling, looks like the same thing Dmitri hit in #hw-platform a few weeks back. Fix there was a thermal pad. Found two that match the rig spec — Thermalright 2.0 mm ($11) or Arctic TP-3 2.0 mm ($16). Which should I order, and how many?" } }] } },
    { t: 350, e: { type: "approval_request", id: "s4", name: "draft_and_send", input: { to: "Priya Menon · Slack DM" }, node: { type: "send", conf: 80, title: "Draft a message — send for your approval", to: "Priya Menon · Slack DM", message: "Hey Priya — re: the rig throttling, looks like the same thing Dmitri hit in #hw-platform a few weeks back. Fix there was a thermal pad. Found two that match the rig spec — Thermalright 2.0 mm ($11) or Arctic TP-3 2.0 mm ($16). Which should I order, and how many?" } } },
  ],
  [ { t: 500, e: { type: "text_delta", text: "Sent. I'll watch for her reply." } },
    { t: 400, e: { type: "assistant_message", text: "Sent. I'll watch for her reply.", toolCalls: [{ id: "s5", name: "await_reply", input: { to: "Priya Menon" } }] } },
    { t: 900, e: { type: "tool_result", id: "s5", name: "await_reply", node: { type: "await", conf: 90, title: "Awaiting reply from Priya Menon", reply: "Priya Menon: 👍 go with the 2.0 mm Arctic, order 6 of them." } } },
    { t: 700, e: { type: "text_delta", text: "She picked the Arctic, qty 6. Ready to file the order as a Jira ticket — execute on your approval." } },
    { t: 550, e: { type: "assistant_message", text: "She picked the Arctic, qty 6. Ready to file the order as a Jira ticket — execute on your approval.", toolCalls: [{ id: "s6", name: "create_artifact", input: { system: "Jira", type: "Task", summary: "Order 6× Arctic TP-3 2.0 mm thermal pads for M-series test rigs" } }] } },
    { t: 350, e: { type: "approval_request", id: "s6", name: "create_artifact", input: { system: "Jira" }, node: { type: "create", conf: 88, title: "File the artifact — execute on your approval", ticket: { project: "HW-OPS", type: "Task", summary: "Order 6× Arctic TP-3 2.0 mm thermal pads for M-series test rigs", assignee: "You", links: "standup note · #hw-platform thread · Priya DM" } } } },
  ],
  [ { t: 500, e: { type: "text_delta", text: "Filed as HW-OPS · Task. That's the Move done — want to save it to your Log? You can hit “Save as Move”." } },
    { t: 550, e: { type: "assistant_message", text: "Filed as HW-OPS · Task. That's the Move done — want to save it to your Log? You can hit “Save as Move”.", toolCalls: [] } },
    { t: 200, e: { type: "done" } },
  ],
];

/* ================================ component =============================== */
export default function Studio({ seed, model = "claude-sonnet-4-6", onCrystallize }) {
  const [rows, setRows] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [pending, setPending] = useState(null);   // {id,name,node}
  const [adjustText, setAdjustText] = useState(null); // string while editing a gate
  const [mode, setMode] = useState("live");        // "live" | "sim"
  const [notice, setNotice] = useState(null);      // "no_key" | null
  const [noticeLabel, setNoticeLabel] = useState("");
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [providers, setProviders] = useState([]);
  const [activeProvider, setActiveProvider] = useState(null);

  const transcriptRef = useRef([]);
  const activeProviderRef = useRef(null);
  const openSayRef = useRef(null);
  const idRef = useRef(0);
  const simSegRef = useRef(0);
  const streamRef = useRef(null);
  const seededTitle = seed ? seed.title : null;

  useEffect(() => {
    if (document.getElementById("st-styles")) return;
    const el = document.createElement("style");
    el.id = "st-styles"; el.textContent = STUDIO_CSS; document.head.appendChild(el);
  }, []);

  useEffect(() => { activeProviderRef.current = activeProvider; }, [activeProvider]);

  // Load configured providers for the header switcher.
  const loadProviders = useCallback(() => {
    fetch("/api/providers").then((r) => (r.ok ? r.json() : [])).then((list) => {
      if (!Array.isArray(list) || !list.length) return;
      setProviders(list);
      setActiveProvider((cur) => cur || (() => {
        const def = list.find((p) => p.isDefault && p.hasKey) || list.find((p) => p.hasKey) || list.find((p) => p.isDefault) || list[0];
        return def ? def.id : null;
      })());
    }).catch(() => {});
  }, []);
  useEffect(() => { loadProviders(); }, [loadProviders]);

  // Seed from a Desk Move handed off into Studio.
  useEffect(() => {
    if (!seed) return;
    if (seed.ask) return; // contextual ask from another screen — handled by the auto-run effect below
    const recap = (seed.nodes || []).map((n) => ({ kind: "node", id: "seed-" + n.id, node: n, status: "settled" }));
    const intro = { kind: "say", id: "seed-intro",
      text: `Resuming **${seed.title}**. Where it stands: ${seed.line} What do you want to adjust or push forward?` };
    setRows([...recap, intro]);
    transcriptRef.current = [{ role: "assistant",
      text: `Resuming the Move "${seed.title}". Current state: ${seed.line} Standing by for what to adjust or push forward.` }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextId = () => "r" + (++idRef.current);
  const scrollDown = () => requestAnimationFrame(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  });

  /* ---- shared event handler for live + sim ---- */
  const upsertNode = (id, patch) => setRows((prev) => {
    const i = prev.findIndex((r) => r.kind === "node" && r.id === id);
    if (i === -1) return [...prev, { kind: "node", id, ...patch }];
    const copy = prev.slice(); copy[i] = { ...copy[i], ...patch }; return copy;
  });

  const handleEvent = useCallback((evt) => {
    switch (evt.type) {
      case "text_delta": {
        setRows((prev) => {
          if (openSayRef.current) {
            return prev.map((r) => (r.id === openSayRef.current ? { ...r, text: r.text + evt.text, streaming: true } : r));
          }
          const id = nextId(); openSayRef.current = id;
          return [...prev, { kind: "say", id, text: evt.text, streaming: true }];
        });
        scrollDown();
        break;
      }
      case "assistant_message": {
        const sayId = openSayRef.current; openSayRef.current = null;
        setRows((prev) => {
          let next = prev;
          if (sayId) {
            const has = (evt.text || "").trim();
            next = has
              ? prev.map((r) => (r.id === sayId ? { ...r, text: evt.text, streaming: false } : r))
              : prev.filter((r) => r.id !== sayId);
          } else if ((evt.text || "").trim()) {
            next = [...prev, { kind: "say", id: nextId(), text: evt.text, streaming: false }];
          }
          return next;
        });
        transcriptRef.current = [...transcriptRef.current,
          { role: "assistant", text: evt.text || "", toolCalls: evt.toolCalls || [] }];
        scrollDown();
        break;
      }
      case "tool_result": {
        upsertNode(evt.id, { node: evt.node || {}, status: evt.declined ? "declined" : "settled", name: evt.name });
        transcriptRef.current = [...transcriptRef.current, { role: "tool", id: evt.id, name: evt.name, result: evt.result }];
        scrollDown();
        break;
      }
      case "approval_request": {
        upsertNode(evt.id, { node: evt.node || {}, status: "gate", name: evt.name, input: evt.input });
        setPending({ id: evt.id, name: evt.name, node: evt.node });
        scrollDown();
        break;
      }
      case "no_key": setNotice("no_key"); setNoticeLabel(evt.label || "this provider"); setStreaming(false); break;
      case "error": setError(evt.message || "Something went wrong."); setStreaming(false); break;
      case "done": setStreaming(false); break;
      default: break;
    }
  }, []);

  /* ---- live transport ---- */
  const runLive = useCallback(async (resolve) => {
    setStreaming(true); setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptRef.current, resolve: resolve || null, provider: activeProviderRef.current || undefined }),
      });
      if (!res.ok || !res.body) throw new Error("Server returned " + res.status);
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl; while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
          if (line) { try { handleEvent(JSON.parse(line)); } catch { /* skip */ } }
        }
      }
    } catch (e) {
      setError("Couldn't reach the model backend (" + (e.message || e) + "). Try the simulated walkthrough below.");
    } finally {
      setStreaming(false);
    }
  }, [handleEvent]);

  /* ---- sim transport ---- */
  const playSim = useCallback((segIdx) => {
    const seg = SIM[segIdx]; if (!seg) { setStreaming(false); return; }
    setStreaming(true);
    let acc = 0;
    seg.forEach(({ t, e }) => { acc += t; setTimeout(() => {
      handleEvent(e);
      if (e.type === "approval_request" || e.type === "done") setStreaming(false);
    }, acc); });
  }, [handleEvent]);

  /* ---- user actions ---- */
  const submit = (override, opts) => {
    const text = (typeof override === "string" ? override : input).trim();
    if (!text || streaming || pending) return;
    if (typeof override !== "string") setInput("");
    setNotice(null); setError(null);
    setRows((prev) => [...prev, { kind: "user", id: nextId(), text }]);
    // The visible bubble is the plain question; the model sees the screen context
    // prepended (so an ask from any screen is grounded in that screen's data).
    const sent = opts && opts.contextPrefix ? opts.contextPrefix + text : text;
    transcriptRef.current = [...transcriptRef.current, { role: "user", text: sent }];
    scrollDown();
    if (mode === "sim") { simSegRef.current = 0; playSim(0); }
    else runLive();
  };

  // A contextual ask handed in from another screen: auto-run the seeded question
  // once, grounded in that screen's data.
  const askedRef = useRef(false);
  useEffect(() => {
    if (seed && seed.ask && seed.question && !askedRef.current) {
      askedRef.current = true;
      submit(seed.question, { contextPrefix: `[Context — the user is looking at ${seed.scopeLabel || "Steward"}: ${seed.contextLine || ""} Answer grounded in this; reach for the vault and sources as needed.]\n\n` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSim = () => {
    setMode("sim"); setNotice(null); setError(null);
    setRows((prev) => [...prev, { kind: "user", id: nextId(), text: STARTERS[0] }]);
    simSegRef.current = 0; playSim(0); scrollDown();
  };

  const resolveGate = (decision, inputOverride) => {
    if (!pending) return;
    const p = pending; setPending(null); setAdjustText(null);
    if (decision === "approve") {
      upsertNode(p.id, { status: "settled", node: { ...p.node, ...(inputOverride ? applyOverride(p.node, inputOverride) : {}) } });
    } else {
      upsertNode(p.id, { status: "declined" });
    }
    if (mode === "sim") {
      if (decision === "approve") { simSegRef.current += 1; playSim(simSegRef.current); }
      else { handleEvent({ type: "assistant_message", text: "No problem — I'll hold off on that. Tell me what to change.", toolCalls: [] }); handleEvent({ type: "done" }); }
    } else {
      runLive({ id: p.id, decision, note: decision === "reject" ? "User declined." : undefined, input: inputOverride || undefined });
    }
  };

  const crystallize = () => {
    const move = buildMove(rows, seededTitle);
    if (!move.nodes.length) return;
    onCrystallize && onCrystallize(move);
    setSaved(true); setTimeout(() => setSaved(false), 2600);
  };

  const hasNodes = rows.some((r) => r.kind === "node" && r.status !== "declined");
  const empty = rows.length === 0;

  return (
    <div className="st-wrap">
      <div className="st-head">
        <div />
        <div className="st-head-actions">
          {mode === "sim" ? (
            <span className="st-model sim"><span className="st-live" /> Simulated</span>
          ) : providers.length ? (
            <ProviderSwitcher providers={providers} active={activeProvider} onSelect={setActiveProvider} />
          ) : (
            <span className="st-model"><span className="st-live" /> {model}</span>
          )}
          <button className="sw-btn sw-btn-ghost" disabled={!hasNodes || streaming} onClick={crystallize}
            style={(!hasNodes || streaming) ? { opacity: .45 } : null}>
            {saved ? <><Check size={14} /> Saved to Desk</> : <><CircleDot size={14} /> Save as Move</>}
          </button>
        </div>
      </div>

      <div className={"st-stream" + (empty ? " is-empty" : "")} ref={streamRef}>
        {!empty && <div className="st-rail" />}
        {empty && (
          <div className="st-intro">
            <div className="st-orb"><Sparkles size={22} color="#fff" /></div>
            <h2>What should we work on?</h2>
            <p>Describe a goal in your own words. Steward reads your sources, reasons through it, and drafts a Move — pausing for your OK before it sends or files anything.</p>
            <div className="st-starts">
              {STARTERS.map((s) => (
                <button key={s} className="st-start" onClick={() => submit(s)}>
                  <CornerDownLeft size={16} /><span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {notice === "no_key" && (
          <div className="st-notice">
            <b>No key for {noticeLabel || "this provider"}</b>
            <p>Open <b>Settings</b> (lower-left) to add a key, or set <code>ANTHROPIC_API_KEY</code> / <code>OPENAI_API_KEY</code> in <code>.env.local</code>. Settings changes apply live; <code>.env.local</code> needs a restart. Meanwhile you can run a scripted walkthrough of a full Move.</p>
            <button className="sw-btn sw-btn-amber" style={{ marginTop: 11 }} onClick={startSim}><Sparkles size={14} /> Run simulated walkthrough</button>
          </div>
        )}
        {error && (
          <div className="st-err">{error}
            <button className="sw-btn sw-btn-text" onClick={startSim} style={{ marginLeft: 8 }}>Run simulated walkthrough</button>
          </div>
        )}

        {rows.map((r) => {
          if (r.kind === "user") return <div className="st-row st-user" key={r.id}><div>{r.text}</div></div>;
          if (r.kind === "say") return (
            <div className="st-row st-say" key={r.id}>{renderRich(r.text)}{r.streaming && <span className="st-cursor" />}</div>
          );
          if (r.kind === "node") return (
            <StudioNode key={r.id} row={r}
              isPending={pending && pending.id === r.id}
              adjustText={adjustText} setAdjustText={setAdjustText}
              onResolve={resolveGate} />
          );
          return null;
        })}
      </div>

      <div className="st-composer">
        <div className="st-inputwrap">
          <textarea className="st-input" rows={1} value={input} placeholder={pending ? "Approve or adjust the step above to continue…" : "Describe a goal, or steer the work…"}
            onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            disabled={streaming || !!pending} />
          <button className="st-send" disabled={!input.trim() || streaming || !!pending} onClick={submit} aria-label="Send"><ArrowUp size={18} /></button>
        </div>
        <div className="st-hint">
          <Notebook size={12} /> Sources: Vault (RAG) · Granola · Slack · Jira · Outlook (sample) · Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  );
}

/* styled provider dropdown (replaces the native <select>) */
function ProviderSwitcher({ providers, active, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cur = providers.find((p) => p.id === active);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mousedown", onDoc); window.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className="st-switch" ref={ref}>
      <button className="st-switch-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open}>
        <span className="st-live" style={(cur && cur.hasKey) ? null : { background: "var(--amber)" }} />
        {cur ? cur.label : "Provider"}
        <ChevronDown size={13} className="st-chev" />
      </button>
      {open && (
        <div className="st-switch-menu" role="listbox">
          {providers.map((p) => (
            <button key={p.id} role="option" aria-selected={p.id === active} className="st-switch-item"
              onClick={() => { onSelect(p.id); setOpen(false); }}>
              <span className="st-switch-check">{p.id === active ? <Check size={13} /> : null}</span>
              <span className="st-switch-label">{p.label}</span>
              {!p.hasKey && <span className="st-switch-tag">no key</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* update a node's display when the user adjusts a gated draft before approving */
function applyOverride(node, override) {
  const n = { ...node };
  if (node.type === "send") n.message = override.message;
  if (node.type === "create" && node.ticket) n.ticket = { ...node.ticket, summary: override.summary };
  return n;
}

/* ------------------------------- one node --------------------------------- */
function StudioNode({ row, isPending, adjustText, setAdjustText, onResolve }) {
  const n = row.node || {};
  const Ic = NODE_ICON[n.type] || CircleDot;
  const st = row.status;
  const dot = st === "settled" ? <Check /> : st === "declined" ? <X /> : st === "running" ? <RotateCw /> : <Ic />;
  const editing = adjustText !== null && isPending;
  const editValue = n.type === "create" ? (n.ticket ? n.ticket.summary : "") : (n.message || "");

  return (
    <div className="st-row st-node" data-st={st}>
      <span className="st-dot">{dot}</span>
      <div className="sw-card">
        <div className="sw-ntype">
          {NODE_LABEL[n.type] || "Step"}
          {typeof n.conf === "number" && <span className="sw-nconf sw-mono">{n.conf}% est.</span>}
        </div>
        <div className="sw-ntitle">{n.title}</div>
        {n.body && <div className="sw-nbody">{n.body}</div>}

        {n.parts && (
          <div className="sw-parts">
            {n.parts.map((p, i) => (
              <div className="sw-part" key={i}>
                <b>{p.name}</b><span className="sw-spec">{p.spec}</span>
                <span className="sw-amz">AMAZON</span><span className="sw-price sw-mono">{p.price}</span>
              </div>
            ))}
          </div>
        )}

        {n.retrieved && (
          <div className="sw-cites">
            {n.retrieved.map((c, i) => (
              <div className="sw-cite" key={i}>
                <div className="sw-cite-top">
                  <span className="sw-cite-note"><FileText size={13} /> {c.note}</span>
                  <span className="sw-cite-score sw-mono">{c.score.toFixed(2)}</span>
                </div>
                <div className="sw-cite-snip">“{c.snippet}”</div>
              </div>
            ))}
          </div>
        )}

        {n.severityNote && (
          <div className="sw-aud" style={{ borderColor: "rgba(192,57,43,.35)", background: "var(--red-soft)" }}>
            <AlertTriangle size={15} style={{ color: "var(--red)" }} />
            <span><b style={{ color: "var(--red)" }}>{n.severityNote}</b></span>
          </div>
        )}

        {n.numbers && (
          <div className="sw-nums">
            {n.numbers.map((x, i) => (
              <div className={"sw-num" + (x.flag ? " flag" : "")} key={i}>
                <span className="sw-num-l">{x.label}</span><span className="sw-num-v sw-mono">{x.value}</span><span className="sw-num-n">{x.note}</span>
              </div>
            ))}
          </div>
        )}

        {n.brief && (
          <div className="sw-brief">
            <div className="sw-brief-h"><FileText size={13} /> {n.brief.kind}</div>
            <div className="sw-brief-body">
              {n.brief.sections ? n.brief.sections.map((s, i) => (
                <div className="sw-brief-sec" key={i}><div className="sw-brief-sh">{s.h}</div>{s.items.map((it, j) => <div className="sw-brief-li" key={j}>{it}</div>)}</div>
              )) : (n.brief.points || []).map((p, i) => <div className="sw-brief-li" key={i}>{p}</div>)}
            </div>
          </div>
        )}

        {n.statusUpdate && (
          <div className="sw-status">
            <div className="sw-status-h"><Radio size={14} /> {n.statusUpdate.headline}</div>
            <div className="sw-status-b">{n.statusUpdate.body}</div>
          </div>
        )}

        {n.reassign && (
          <div className="sw-reassign">
            <span className="sw-tag">{n.reassign.from}</span>
            <ArrowRight size={16} className="sw-reassign-arrow" />
            <span className="sw-reassign-who"><span><div className="sw-reassign-name">{n.reassign.to}</div><div className="sw-reassign-reason">{n.reassign.reason}</div></span></span>
          </div>
        )}

        {n.message && !editing && (
          <div className="sw-bubble"><div className="sw-bubble-to">To {n.to}</div>{n.message}</div>
        )}
        {n.reply && <div className="sw-reply">{n.reply}</div>}

        {n.ticket && !editing && (
          <div className="sw-ticket">
            <div className="sw-tk-head"><Ticket size={13} /> {n.ticket.project} · {n.ticket.type}</div>
            <div className="sw-tk-row"><span className="sw-tk-k">Summary</span><span className="sw-tk-v">{n.ticket.summary}</span></div>
            <div className="sw-tk-row"><span className="sw-tk-k">Assignee</span><span className="sw-tk-v">{n.ticket.assignee}</span></div>
            <div className="sw-tk-row"><span className="sw-tk-k">Links</span><span className="sw-tk-v">{n.ticket.links}</span></div>
          </div>
        )}

        {n.srcs && n.srcs.length > 0 && !editing && (
          <div className="sw-nsrc">{n.srcs.map((s) => <span key={s} className="sw-tag">{s}</span>)}</div>
        )}

        {editing && (
          <div className="st-adjust">
            <textarea rows={n.type === "create" ? 2 : 4} defaultValue={editValue}
              onChange={(e) => setAdjustText(e.target.value)} autoFocus />
          </div>
        )}

        {/* gate actions */}
        {isPending && !editing && (
          <div className="sw-nact">
            <button className="sw-btn sw-btn-amber" onClick={() => onResolve("approve")}>
              {n.type === "create" ? <><Ticket size={14} /> Execute · file</> : <><Send size={14} /> Approve & send</>}
            </button>
            <button className="sw-btn sw-btn-text" onClick={() => setAdjustText(editValue)}><PenLine size={14} /> Adjust</button>
            <button className="sw-btn sw-btn-text" onClick={() => onResolve("reject")} style={{ color: "var(--red)" }}>Reject</button>
          </div>
        )}
        {isPending && editing && (
          <div className="sw-nact">
            <button className="sw-btn sw-btn-pri" onClick={() => onResolve("approve", n.type === "create" ? { summary: adjustText } : { message: adjustText })}>
              <Check size={14} /> Use this & approve
            </button>
            <button className="sw-btn sw-btn-text" onClick={() => setAdjustText(null)}>Cancel</button>
          </div>
        )}

        {st === "settled" && (n.type === "send" || n.type === "create") && (
          <div style={{ marginTop: 10 }}><span className="st-settled-note"><Check size={13} /> {n.type === "send" ? "Sent" : "Filed"}</span></div>
        )}
        {st === "declined" && (
          <div style={{ marginTop: 10 }}><span className="st-declined-note"><X size={13} /> Declined — not sent</span></div>
        )}
      </div>
    </div>
  );
}

/* very small **bold** renderer for assistant prose */
function renderRich(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p) ? <b key={i}>{p.slice(2, -2)}</b> : <React.Fragment key={i}>{p}</React.Fragment>);
}
