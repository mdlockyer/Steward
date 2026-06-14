import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Inbox, Layers, Calendar, GitBranch, Sparkles, Plug, Check, Archive,
  Settings2, ShieldAlert, ArrowRight, Notebook,
} from "lucide-react";
import { CSS } from "./styles.js";
import {
  SEED_LOOPS, SEED_LOG, SEED_MEETINGS, SEED_MEMORY, SEED_ROADMAP, SEED_VAULT,
  SEED_NOTIFICATIONS, SCREEN_INFO, person, priorityOf, MOVE_TYPE,
} from "./data.js";
import { MoveInspector, NotifBell, NotifPopover, QuickInfo } from "./components.jsx";
import Desk from "./Desk.jsx";
import Carrying, { LoopDetail } from "./Carrying.jsx";
import Meetings, { MeetingDetail } from "./Meetings.jsx";
import Roadmap from "./Roadmap.jsx";
import Vault from "./Vault.jsx";
import Sources from "./Sources.jsx";
import Log from "./Log.jsx";
import Studio from "./Studio.jsx";
import Settings from "./Settings.jsx";

/* ============================================================================
   STEWARD — a loops-and-Moves tool. ALL DATA IS MOCK / SAMPLE.

   Everything tracked is an open loop (owner · counterparty · state · age). A
   Move opens a loop, advances one, or closes one. The Log is only the closed
   slice of what you are Carrying. The spine + gates + correct-and-recompute
   interaction carries over from the prototype unchanged.
   ========================================================================== */

/* When a Move completes, what happens to its loop. */
const DISPOSITION = {
  errand: "close", delegate: "close", reconcile: "close",
  escalate: "advance", pitch: "advance", prep: "prep",
};

const trim = (s, n = 32) => (s.length > n ? s.slice(0, n) + "…" : s);

export default function Steward() {
  const [route, setRoute] = useState("desk");
  const [deskSeg, setDeskSeg] = useState("all");
  const [carrySeg, setCarrySeg] = useState("all");
  const [openId, setOpenId] = useState(null);        // loop id under inspection
  const [openMode, setOpenMode] = useState("loop");  // "loop" | "move"
  const [moveFrom, setMoveFrom] = useState("desk");  // where a Move was opened from
  const [openMeetingId, setOpenMeetingId] = useState(null);
  const [studioSeed, setStudioSeed] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [loops, setLoops] = useState(SEED_LOOPS);
  const [log, setLog] = useState(SEED_LOG);
  const [meetings, setMeetings] = useState(SEED_MEETINGS);
  const [memory] = useState(SEED_MEMORY);
  const [vault, setVault] = useState(SEED_VAULT);
  const [vaultSel, setVaultSel] = useState("n-readme");

  const [notifs, setNotifs] = useState(SEED_NOTIFICATIONS);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const idRef = useRef(0);
  const mkId = () => "fan-" + (++idRef.current);

  /* ---------- embedded native shell bridge (unchanged contract) ---------- */
  const embedded = typeof window !== "undefined" && !!window.webkit?.messageHandlers?.native;
  const routeRef = useRef(route);
  useEffect(() => { routeRef.current = route; }, [route]);

  useEffect(() => {
    let el = document.getElementById("sw-styles");
    if (!el) { el = document.createElement("style"); el.id = "sw-styles"; document.head.appendChild(el); }
    el.textContent = CSS;
  }, []);

  useEffect(() => {
    if (!embedded) return;
    document.documentElement.classList.add("sw-native");
    const onNavigate = (e) => {
      const id = e.detail;
      if (id === routeRef.current) return;
      setOpenId(null); setOpenMeetingId(null);
      if (id === "studio") setStudioSeed(null);
      setRoute(id);
    };
    window.addEventListener("native:navigate", onNavigate);
    window.webkit.messageHandlers.native.postMessage({ type: "ready" });
    return () => {
      window.removeEventListener("native:navigate", onNavigate);
      document.documentElement.classList.remove("sw-native");
    };
  }, [embedded]);

  useEffect(() => {
    if (!embedded) return;
    window.webkit.messageHandlers.native.postMessage({ type: "route", id: route });
  }, [embedded, route]);

  // Inside the native shell, surface the top unread fire as a real macOS
  // notification once on launch (Reactive mode: the fire comes to find you).
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (!embedded || notifiedRef.current) return;
    const fire = SEED_NOTIFICATIONS.find((n) => n.kind === "fire" && !n.read);
    if (fire && window.__native?.notify) {
      notifiedRef.current = true;
      window.__native.notify({ title: "Steward · " + fire.title, body: fire.body });
    }
  }, [embedded]);

  /* ------------------------------ toast ---------------------------------- */
  const showToast = (msg, action) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, action });
    toastTimer.current = setTimeout(() => setToast(null), action ? 5200 : 3200);
  };

  /* ------------------------- derived selections -------------------------- */
  const openLoop = useMemo(() => loops.find((l) => l.id === openId) || null, [loops, openId]);
  const openMove = openLoop && openMode === "move" ? openLoop.move : null;
  const openMeeting = useMemo(() => meetings.find((m) => m.id === openMeetingId) || null, [meetings, openMeetingId]);

  const deskCount = loops.filter((l) => l.move).length;
  const fireCount = loops.filter((l) => l.type === "fire" && l.interrupt).length;
  const upcomingCount = meetings.filter((m) => m.status === "upcoming").length;
  const roadmapRisk = SEED_ROADMAP.filter((r) => r.status !== "onTrack").length;
  const unread = notifs.filter((n) => !n.read).length;

  // Quick Info: auto-expand the first few visits to each screen, then keep it
  // collapsed (one click to reopen). A manual collapse is remembered per screen.
  useEffect(() => {
    let seen = {};
    try { seen = JSON.parse(localStorage.getItem("sw.quickinfo") || "{}"); } catch { /* ignore */ }
    if ((seen[route] || 0) < 3) {
      setQuickOpen(true);
      seen[route] = (seen[route] || 0) + 1;
      try { localStorage.setItem("sw.quickinfo", JSON.stringify(seen)); } catch { /* ignore */ }
    } else setQuickOpen(false);
  }, [route]);

  // Close the notification popover on outside-click / Escape.
  useEffect(() => {
    if (!notifOpen) return;
    const onDoc = (e) => { if (!e.target.closest(".sw-notif-pop") && !e.target.closest(".sw-bell")) setNotifOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setNotifOpen(false); };
    window.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mousedown", onDoc); window.removeEventListener("keydown", onKey); };
  }, [notifOpen]);

  /* --------------------- Move spine state machine ------------------------ */
  const patchNodes = (loopId, fn) =>
    setLoops((prev) => prev.map((l) => (l.id === loopId ? { ...l, move: { ...l.move, nodes: fn(l.move.nodes) } } : l)));

  const nextStatus = (node) =>
    node.type === "send" || node.type === "create" ? "gate" : node.type === "await" ? "await" : "edge";

  const acceptNode = (loopId, nid) => patchNodes(loopId, (nodes) => {
    const i = nodes.findIndex((n) => n.id === nid);
    return nodes.map((n, idx) => idx === i ? { ...n, status: "settled" } : idx === i + 1 ? { ...n, status: nextStatus(n) } : n);
  });

  const approveSend = (loopId, nid) => {
    patchNodes(loopId, (nodes) => {
      const i = nodes.findIndex((n) => n.id === nid);
      return nodes.map((n, idx) => idx === i ? { ...n, status: "settled", sent: true }
        : idx === i + 1 ? { ...n, status: n.type === "await" ? "await" : n.type === "create" ? "gate" : "edge" } : n);
    });
    const cp = openLoop ? person(openLoop.counterparty).name.split(" ")[0] : "them";
    showToast(`Sent to ${cp}. Steward will watch for the reply.`);
  };

  const simulateReply = (loopId, nid) => patchNodes(loopId, (nodes) => {
    const i = nodes.findIndex((n) => n.id === nid);
    return nodes.map((n, idx) => idx === i ? { ...n, status: "settled", gotReply: true }
      : idx === i + 1 ? { ...n, status: n.type === "create" ? "gate" : "edge" } : n);
  });

  const executeCreate = (loopId, nid) => patchNodes(loopId, (nodes) =>
    nodes.map((n) => (n.id === nid ? { ...n, status: "settled", filed: true } : n)));

  const submitFeedback = (loopId, nid, note) => {
    setLoops((prev) => prev.map((l) => l.id === loopId ? { ...l, move: { ...l.move, adjusted: true,
      nodes: l.move.nodes.map((n, idx, arr) => {
        const i = arr.findIndex((x) => x.id === nid);
        return idx >= i ? { ...n, status: "recomputing", note: idx === i ? note : n.note } : n;
      }) } } : l));
    showToast("Recomputing from that step forward… verified steps above hold.");
    setTimeout(() => patchNodes(loopId, (nodes) => {
      const i = nodes.findIndex((n) => n.id === nid);
      return nodes.map((n, idx) => {
        if (idx < i) return n;
        let nn = { ...n, recomputed: idx > i };
        if (nn.alt) { if (nn.alt.body) nn.body = nn.alt.body; if (nn.alt.parts) nn.parts = nn.alt.parts; if (nn.alt.message) nn.message = nn.alt.message; }
        if (nn.altTicket) nn.ticket = nn.altTicket;
        nn.status = idx === i ? "edge" : "pending";
        return nn;
      });
    }), 1300);
  };

  /* completion: close → Log, advance → stays in Carrying, prep → consumed */
  const completeMove = (loopId) => {
    const l = loops.find((x) => x.id === loopId);
    if (!l) return;
    const disp = DISPOSITION[l.move.type];
    if (disp === "close") {
      const entry = { id: "lg-" + l.id, title: l.title, type: l.move.type, outcome: l.move.terminal,
        when: "Just now", counterparty: l.counterparty,
        trace: `${l.srcs.length} sources · ${l.move.nodes.length} steps · ${l.move.adjusted ? "1 adjustment" : "no adjustments"}` };
      setLog((lp) => [entry, ...lp]);
      setLoops((prev) => prev.filter((x) => x.id !== loopId));
      showToast(`Closed “${trim(l.title)}” — filed in Log.`, { label: "View Log", fn: () => setRoute("log") });
    } else if (disp === "advance") {
      setLoops((prev) => prev.map((x) => (x.id === loopId ? advanceLoop(x) : x)));
      showToast(l.move.type === "escalate"
        ? "Incident opened, stakeholders updated. Steward is tracking the fix."
        : "Re-pitched with the numbers and nudged. Steward will watch for the reply.");
    } else {
      setLoops((prev) => prev.map((x) => (x.id === loopId ? { ...x, prepped: true, move: undefined } : x)));
      showToast(`Brief ready — you're set for ${person(l.counterparty).name.split(" ")[0]}.`);
    }
    setOpenId(null); setOpenMode("loop");
  };

  // Advancing consumes the proposal: the loop leaves the Desk but stays tracked
  // in Carrying with its new state and an appended trace entry.
  const advanceLoop = (l) => {
    if (l.move.type === "escalate") return { ...l, move: undefined, state: "inFlight", interrupt: false, severity: 70,
      nextNudge: "10:30", trace: [...l.trace, { when: "now", kind: "sent", label: "Incident opened; stakeholder update sent — fix in progress" }] };
    return { ...l, move: undefined, state: "waiting", nextNudge: "tomorrow",
      trace: [...l.trace, { when: "now", kind: "sent", label: "Re-pitched with numbers; nudged Dana, cc Raj" }] };
  };

  /* bound actions for the open Move (recreated each render → fresh closures) */
  const lastId = openMove ? openMove.nodes[openMove.nodes.length - 1].id : null;
  const boundActions = openMove ? {
    acceptNode: (nid) => { acceptNode(openId, nid); if (nid === lastId) setTimeout(() => completeMove(openId), 650); },
    approveSend: (nid) => { approveSend(openId, nid); if (nid === lastId) setTimeout(() => completeMove(openId), 750); },
    simulateReply: (nid) => simulateReply(openId, nid),
    executeCreate: (nid) => { executeCreate(openId, nid); setTimeout(() => completeMove(openId), 750); },
    submitFeedback: (nid, note) => submitFeedback(openId, nid, note),
  } : null;

  /* ----------------------------- loop actions ---------------------------- */
  const nudge = (loopId) => {
    const l = loops.find((x) => x.id === loopId); if (!l) return;
    const cp = person(l.counterparty).name.split(" ")[0];
    setLoops((prev) => prev.map((x) => x.id === loopId ? { ...x, nextNudge: "sent",
      trace: [...x.trace, { when: "now", kind: "nudge", label: `Nudged ${cp}` }] } : x));
    showToast(`Nudged ${cp}. Steward will watch for a reply.`);
  };
  const escalate = (loopId) => {
    const l = loops.find((x) => x.id === loopId); if (!l) return;
    setLoops((prev) => prev.map((x) => x.id === loopId ? { ...x, state: "escalated",
      severity: Math.min(95, x.severity + 14),
      trace: [...x.trace, { when: "now", kind: "escalated", label: "Escalated — raised severity, looped in the owner" }] } : x));
    showToast(`Escalated “${trim(l.title)}”.`);
  };
  const closeLoop = (loopId) => {
    const l = loops.find((x) => x.id === loopId); if (!l) return;
    const entry = { id: "lg-" + l.id, title: l.title, type: l.move?.type || "errand",
      outcome: l.move?.terminal || "Closed by you", when: "Just now", counterparty: l.counterparty,
      trace: `${l.srcs.length} sources · ${l.trace.length} events · closed manually` };
    setLog((lp) => [entry, ...lp]);
    setLoops((prev) => prev.filter((x) => x.id !== loopId));
    setOpenId(null);
    showToast(`Closed “${trim(l.title)}” — filed in Log.`, { label: "View Log", fn: () => setRoute("log") });
  };
  const dismissDesk = (loopId) => {
    const l = loops.find((x) => x.id === loopId); if (!l) return;
    const stash = l.move;
    setLoops((prev) => prev.map((x) => x.id === loopId ? { ...x, move: undefined } : x));
    showToast(`Cleared from Desk — still tracked in Carrying.`,
      { label: "Undo", fn: () => setLoops((prev) => prev.map((x) => x.id === loopId ? { ...x, move: stash } : x)) });
  };

  /* fan a meeting commitment out into a tracked loop */
  const fanOut = (meetingId, idx) => {
    const m = meetings.find((x) => x.id === meetingId); if (!m) return;
    const c = m.commitments[idx]; const newId = mkId();
    const mine = c.owner === "you";
    const newLoop = {
      id: newId, type: mine ? "commitment" : "waiting", title: c.text,
      owner: c.owner, counterparty: c.counterparty, state: mine ? "open" : "waiting",
      severity: 44, needleImpact: 46, age: "just now", ageRank: 99, nextNudge: "today",
      srcs: ["Granola", m.title], context: `Fanned out of "${m.title}". ${mine ? "You committed to this." : person(c.owner).name + " committed to this."}`,
      trace: [{ when: "now", kind: "opened", label: `Committed in ${m.title}` }],
    };
    setLoops((prev) => [newLoop, ...prev]);
    setMeetings((prev) => prev.map((mm) => mm.id !== meetingId ? mm
      : { ...mm, commitments: mm.commitments.map((cc, i) => i === idx ? { ...cc, fanned: true, loopId: newId } : cc) }));
    showToast(`Added “${trim(c.text)}” to Carrying.`,
      { label: "View", fn: () => { setOpenMeetingId(null); setRoute("carrying"); setOpenId(newId); setOpenMode("loop"); } });
  };

  /* ------------------------------ vault ---------------------------------- */
  const vaultEdit = (id, content) =>
    setVault((prev) => prev.map((i) => (i.id === id ? { ...i, content, updated: "now" } : i)));
  const vaultRename = (id, name) => {
    const nm = name.trim(); if (!nm) return;
    setVault((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      let final = nm;
      if (i.type === "file" && i.ext === "md" && !/\.md$/i.test(final)) final += ".md";
      return { ...i, name: final };
    }));
  };
  const vaultDelete = (id) => {
    const toDel = new Set([id]);
    let grew = true;
    while (grew) { grew = false; vault.forEach((i) => { if (i.parentId && toDel.has(i.parentId) && !toDel.has(i.id)) { toDel.add(i.id); grew = true; } }); }
    const target = vault.find((i) => i.id === id);
    setVault((prev) => prev.filter((i) => !toDel.has(i.id)));
    if (toDel.has(vaultSel)) setVaultSel(null);
    showToast(`Moved “${target ? target.name : "item"}” to trash.`);
  };
  const vaultMove = (id, parentId) =>
    setVault((prev) => prev.map((i) => (i.id === id ? { ...i, parentId } : i)));
  const vaultCreateFile = (parentId) => {
    const id = "vn-" + (++idRef.current);
    const siblings = vault.filter((i) => (i.parentId || null) === (parentId || null) && i.type === "file");
    let n = 0, name = "Untitled.md";
    while (siblings.some((s) => s.name.toLowerCase() === name.toLowerCase())) { n += 1; name = `Untitled ${n}.md`; }
    setVault((prev) => [...prev, { id, type: "file", ext: "md", name, parentId: parentId || null, updated: "now", content: "" }]);
    setVaultSel(id); setRoute("vault");
  };
  const vaultCreateFolder = (parentId) => {
    const id = "vf-" + (++idRef.current);
    setVault((prev) => [...prev, { id, type: "folder", name: "New folder", parentId: parentId || null }]);
  };
  const vaultWiki = (target) => showToast(`No note named “${target}” in the vault yet.`);

  /* ----------------------------- navigation ------------------------------ */
  const go = (r) => { setRoute(r); setOpenId(null); setOpenMeetingId(null); if (r === "studio") setStudioSeed(null); };
  const openDeskMove = (loopId) => { setOpenId(loopId); setOpenMode("move"); setMoveFrom("desk"); };
  const openLoopDetail = (loopId) => { setOpenId(loopId); setOpenMode("loop"); };
  const openMoveFromLoop = (loopId) => { setOpenId(loopId); setOpenMode("move"); setMoveFrom("loop"); };
  const openLoopFromRoadmap = (loopId) => { setRoute("carrying"); setOpenId(loopId); setOpenMode("loop"); };
  const backFromMove = () => { if (moveFrom === "loop") setOpenMode("loop"); else setOpenId(null); };
  const toStudio = (move, loop) => {
    setStudioSeed({ ...move, title: loop ? loop.title : move.title, line: loop ? loop.context : "" });
    setRoute("studio"); setOpenId(null);
  };

  /* notifications + quick info */
  const markAllRead = () => setNotifs((p) => p.map((n) => ({ ...n, read: true })));
  const openNotif = (n) => {
    setNotifs((p) => p.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setNotifOpen(false);
    const loop = loops.find((l) => l.id === n.loopId);
    if (loop?.move) { setRoute("desk"); openDeskMove(loop.id); }
    else if (loop) { setRoute("carrying"); setOpenId(loop.id); setOpenMode("loop"); }
  };
  const toggleQuick = () => setQuickOpen((v) => {
    const next = !v;
    if (!next) {
      try { const s = JSON.parse(localStorage.getItem("sw.quickinfo") || "{}"); s[route] = 99; localStorage.setItem("sw.quickinfo", JSON.stringify(s)); } catch { /* ignore */ }
    }
    return next;
  });

  const NAV_MAIN = [
    { id: "desk", label: "Desk", ic: Inbox, count: deskCount, fire: fireCount > 0 },
    { id: "carrying", label: "Carrying", ic: Layers, count: loops.length },
    { id: "meetings", label: "Meetings", ic: Calendar, count: upcomingCount },
    { id: "roadmap", label: "Roadmap", ic: GitBranch, count: roadmapRisk || null },
    { id: "vault", label: "Vault", ic: Notebook, count: vault.filter((i) => i.type === "file").length },
  ];
  const NAV_TOOLS = [
    { id: "studio", label: "Studio", ic: Sparkles },
    { id: "sources", label: "Sources", ic: Plug },
    { id: "log", label: "Log", ic: Check, count: log.length },
  ];

  /* -------------------------------- render ------------------------------- */
  return (
    <div className="sw-root">
      {/* The sidebar is always present — in the browser and inside the native
          hollow shell alike. The native window contributes only traffic lights. */}
      <aside className="sw-rail">
        <div className="sw-brand">
          <div className="sw-mark"><span /></div><b>Steward</b>
          <span className="sw-brand-tools">
            <span className="sw-pulse" title="Listening · swept 4m ago" />
            <NotifBell count={unread} open={notifOpen} onClick={() => setNotifOpen((v) => !v)} />
          </span>
        </div>
        {notifOpen && <NotifPopover items={notifs} onOpen={openNotif} onClear={markAllRead} />}
        <nav className="sw-nav" aria-label="Sections">
          {NAV_MAIN.map((it) => <NavItem key={it.id} it={it} route={route} onGo={go} />)}
          <div className="sw-nav-sec">Tools</div>
          {NAV_TOOLS.map((it) => <NavItem key={it.id} it={it} route={route} onGo={go} />)}
        </nav>
        <div className="sw-rail-foot">
          <QuickInfo text={SCREEN_INFO[route] || ""} open={quickOpen} onToggle={toggleQuick} />
          <button className="sw-navitem" onClick={() => setSettingsOpen(true)}><Settings2 /> <span className="sw-navlabel">Settings</span></button>
        </div>
      </aside>

      <main className="sw-main">
        {route === "desk" && (
          openMove
            ? <MoveInspector loop={openLoop} m={openMove} backLabel="Desk" onBack={backFromMove} onStudio={toStudio} actions={boundActions} />
            : <Desk loops={loops} seg={deskSeg} setSeg={setDeskSeg} onOpen={openDeskMove} onDismiss={dismissDesk} />
        )}

        {route === "carrying" && (
          openMove
            ? <MoveInspector loop={openLoop} m={openMove} backLabel="Loop" onBack={backFromMove} onStudio={toStudio} actions={boundActions} />
            : openLoop
              ? <LoopDetail l={openLoop} onBack={() => setOpenId(null)} onOpenMove={openMoveFromLoop} onNudge={nudge} onEscalate={escalate} onClose={closeLoop} />
              : <Carrying loops={loops} seg={carrySeg} setSeg={setCarrySeg} onOpen={openLoopDetail} />
        )}

        {route === "meetings" && (
          openMeeting
            ? <MeetingDetail m={openMeeting} loops={loops} onBack={() => setOpenMeetingId(null)} onFanOut={fanOut} />
            : <Meetings meetings={meetings} onOpen={(id) => setOpenMeetingId(id)} />
        )}

        {route === "roadmap" && <Roadmap roadmap={SEED_ROADMAP} onOpenLoop={openLoopFromRoadmap} />}

        {route === "vault" && (
          <Vault vault={vault} selectedId={vaultSel} onSelect={setVaultSel}
            onEdit={vaultEdit} onCreateFile={vaultCreateFile} onCreateFolder={vaultCreateFolder}
            onRename={vaultRename} onDelete={vaultDelete} onMove={vaultMove} onWikiLink={vaultWiki} />
        )}

        {route === "studio" && (
          <Studio key={studioSeed ? studioSeed.id : "fresh"} seed={studioSeed} model="Claude"
            onCrystallize={(move) => {
              const newId = mkId();
              const loop = { id: newId, type: "ask", title: move.title, owner: "you", counterparty: "priya",
                state: "inFlight", severity: 48, needleImpact: 50, age: "just now", ageRank: 99, nextNudge: "today",
                srcs: move.srcs || ["Studio"], context: move.line || "Worked live in Studio.", move: { ...move, type: "errand" },
                trace: [{ when: "now", kind: "opened", label: "Crystallized from a Studio session" }] };
              setLoops((p) => [loop, ...p]);
              showToast(`Saved “${trim(move.title)}” to your Desk.`,
                { label: "Open on Desk", fn: () => { setRoute("desk"); openDeskMove(newId); } });
            }} />
        )}

        {route === "sources" && <Sources memory={memory} />}
        {route === "log" && <Log log={log} />}
        {route === "settings" && <Settings onClose={() => setRoute("desk")} />}

        {toast && (
          <div className="sw-toast" role="status">
            <span>{toast.msg}</span>
            {toast.action && <button onClick={() => { toast.action.fn(); setToast(null); }}>{toast.action.label}</button>}
          </div>
        )}
      </main>

      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function NavItem({ it, route, onGo }) {
  const Ic = it.ic;
  return (
    <button className="sw-navitem" aria-current={route === it.id} onClick={() => onGo(it.id)}>
      <Ic /> <span className="sw-navlabel">{it.label}</span>
      {it.count != null && <span className={"sw-count" + (it.fire ? " is-fire" : "")}>{it.count}</span>}
    </button>
  );
}
