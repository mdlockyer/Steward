/* ============================================================================
   STEWARD — design system. One token set, one stylesheet, injected once.
   Base (rail · groups · spine · gates · toast) carries over from the prototype
   unchanged; the loops-and-Moves surfaces extend it without new primitives.
   ========================================================================== */

export const CSS = `
:root{
  --canvas:#f5f5f7; --surface:#ffffff; --surface-2:#fbfbfd;
  --ink:#1d1d1f; --ink-2:#6e6e73; --ink-3:#a1a1a8;
  --hair:rgba(0,0,0,.08); --hair-2:rgba(0,0,0,.06);
  --accent:#0a6dff; --accent-soft:rgba(10,109,255,.10); --accent-ink:#fff;
  --amber:#b06a00; --amber-soft:rgba(255,159,10,.14);
  --green:#1d7a3f; --green-soft:rgba(52,199,89,.16);
  --red:#c0392b; --red-soft:rgba(255,59,48,.12);
  --r:12px; --r-sm:8px; --r-lg:16px;
  --sh-1:0 1px 2px rgba(0,0,0,.04),0 1px 3px rgba(0,0,0,.03);
  --sh-2:0 6px 22px rgba(0,0,0,.07),0 1px 3px rgba(0,0,0,.05);
  --sh-pop:0 18px 50px rgba(0,0,0,.16),0 2px 8px rgba(0,0,0,.08);
  --ui:-apple-system,"SF Pro Text","SF Pro Display",system-ui,sans-serif;
  --mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,monospace;
}
*{box-sizing:border-box}
.sw-root{font-family:var(--ui);color:var(--ink);background:var(--canvas);
  width:100%;max-width:1280px;height:min(880px,92vh);display:flex;overflow:hidden;border-radius:18px;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
  letter-spacing:-0.01em;font-size:14px;line-height:1.45;border:1px solid var(--hair);
  box-shadow:0 24px 70px -28px rgba(0,0,0,.30),0 8px 24px -14px rgba(0,0,0,.14)}
.sw-root button{font-family:inherit;letter-spacing:inherit;cursor:pointer;border:none;background:none;color:inherit}
.sw-root :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:6px}
.sw-mono{font-family:var(--mono);font-feature-settings:"tnum"}

/* ---- sidebar ---- */
.sw-rail{width:240px;flex:0 0 240px;background:var(--surface-2);position:relative;
  border-right:1px solid var(--hair);display:flex;flex-direction:column;padding:18px 12px 12px}
.sw-brand{display:flex;align-items:center;gap:9px;padding:6px 8px 16px}
.sw-mark{width:26px;height:26px;border-radius:8px;background:linear-gradient(160deg,#1d1d1f,#3a3a3e);
  display:grid;place-items:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
.sw-mark span{width:9px;height:9px;border-radius:50%;background:#fff}
.sw-brand b{font-size:16px;font-weight:600;letter-spacing:-0.02em}
.sw-nav{display:flex;flex-direction:column;gap:2px}
.sw-nav-sec{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);
  padding:14px 10px 5px}
.sw-navitem{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;
  color:var(--ink-2);font-weight:500;font-size:13.5px;width:100%;text-align:left;transition:background .12s}
.sw-navitem:hover{background:rgba(0,0,0,.04)}
.sw-navitem[aria-current="true"]{background:var(--surface);color:var(--ink);box-shadow:var(--sh-1)}
.sw-navitem svg{width:17px;height:17px;color:var(--ink-3);flex:0 0 auto}
.sw-navitem[aria-current="true"] svg{color:var(--accent)}
.sw-navlabel{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sw-count{font-size:11.5px;color:var(--ink-3);font-weight:600;font-variant-numeric:tabular-nums}
.sw-count.is-fire{color:#fff;background:var(--red);border-radius:20px;padding:1px 7px;font-size:11px;box-shadow:0 0 0 3px var(--red-soft)}
.sw-rail-foot{margin-top:auto;padding:10px 8px 4px;border-top:1px solid var(--hair);display:flex;flex-direction:column;gap:9px}
.sw-listen{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ink-2)}
.sw-pulse{width:8px;height:8px;border-radius:50%;background:var(--green);position:relative}
.sw-pulse::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid var(--green);
  animation:sw-ring 2.4s ease-out infinite;opacity:0}
@keyframes sw-ring{0%{transform:scale(.6);opacity:.7}100%{transform:scale(1.6);opacity:0}}
.sw-sample{align-self:flex-start;font-size:10.5px;font-weight:600;letter-spacing:.02em;color:var(--ink-3);
  border:1px solid var(--hair);border-radius:6px;padding:3px 7px;background:var(--surface)}

/* ---- main ---- */
.sw-main{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden;position:relative}
.sw-top{display:flex;align-items:flex-end;justify-content:space-between;padding:26px 32px 14px;gap:16px}
.sw-h1{font-size:26px;font-weight:600;letter-spacing:-0.025em;line-height:1.1}
.sw-sub{font-size:13.5px;color:var(--ink-2);margin-top:5px;max-width:600px}
.sw-scroll{flex:1;overflow-y:auto;padding:6px 22px 30px;scroll-behavior:smooth}
.sw-scroll::-webkit-scrollbar{width:9px}.sw-scroll::-webkit-scrollbar-thumb{background:rgba(0,0,0,.14);border-radius:9px;border:2px solid var(--canvas)}

/* segmented */
.sw-seg{display:inline-flex;background:#e9e9ed;border-radius:9px;padding:2px;gap:2px;margin:0 22px;flex-wrap:wrap}
.sw-seg button{font-size:12.5px;font-weight:500;color:var(--ink-2);padding:5px 13px;border-radius:7px;transition:.12s;white-space:nowrap}
.sw-seg button[aria-pressed="true"]{background:var(--surface);color:var(--ink);box-shadow:var(--sh-1);font-weight:600}
.sw-seg .sw-seg-n{font-variant-numeric:tabular-nums;opacity:.6;margin-left:5px;font-size:11px}

/* grouped list */
.sw-group{background:var(--surface);border:1px solid var(--hair);border-radius:var(--r-lg);
  box-shadow:var(--sh-1);overflow:hidden;margin-top:14px}
.sw-group-h{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3);
  display:flex;align-items:center;gap:8px;margin:22px 4px 0}
.sw-group-h .sw-gh-n{color:var(--ink-3);font-weight:600}
.sw-row{display:flex;align-items:center;gap:14px;padding:15px 18px;width:100%;text-align:left;
  border-bottom:1px solid var(--hair-2);transition:background .12s;position:relative}
.sw-row:last-child{border-bottom:none}
.sw-row:hover{background:#fafafc}
.sw-dot{flex:0 0 auto;width:9px;height:9px;border-radius:50%}
.sw-row-main{flex:1;min-width:0}
.sw-row-title{font-size:14.5px;font-weight:600;letter-spacing:-0.015em}
.sw-row-line{font-size:12.5px;color:var(--ink-2);margin-top:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.sw-srcs{display:inline-flex;gap:5px;align-items:center}
.sw-tag{font-size:10.5px;font-weight:600;color:var(--ink-2);background:rgba(0,0,0,.05);
  border-radius:5px;padding:2px 6px;white-space:nowrap}
.sw-row-right{display:flex;align-items:center;gap:14px;flex:0 0 auto}
.sw-state{display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.sw-state-lbl{font-size:11.5px;font-weight:600;display:flex;align-items:center;gap:5px}
.sw-conf{font-size:11px;color:var(--ink-3);font-weight:600}
.sw-term{font-size:11px;color:var(--ink-2);background:rgba(0,0,0,.04);border-radius:6px;padding:3px 8px;white-space:nowrap;display:flex;gap:5px;align-items:center}
.sw-chev{color:var(--ink-3);flex:0 0 auto}
.sw-dismiss{position:absolute;right:14px;top:14px;width:24px;height:24px;border-radius:6px;display:none;
  place-items:center;color:var(--ink-3);background:var(--surface);box-shadow:var(--sh-1)}
.sw-row:hover .sw-dismiss{display:grid}.sw-dismiss:hover{color:var(--ink)}

/* empty */
.sw-empty{text-align:center;padding:64px 20px;color:var(--ink-2)}
.sw-empty-ic{width:46px;height:46px;border-radius:13px;background:var(--surface);border:1px solid var(--hair);
  display:grid;place-items:center;margin:0 auto 14px;color:var(--ink-3);box-shadow:var(--sh-1)}
.sw-empty b{display:block;color:var(--ink);font-size:15px;font-weight:600;margin-bottom:4px;letter-spacing:-0.01em}

/* ---- inspector ---- */
.sw-back{display:inline-flex;align-items:center;gap:3px;font-size:13.5px;color:var(--accent);font-weight:500;margin-bottom:14px}
.sw-insp-head{padding:8px 0 4px}
.sw-insp-title{font-size:23px;font-weight:600;letter-spacing:-0.025em;line-height:1.15}
.sw-throughline{font-size:14px;color:var(--ink-2);margin-top:9px;line-height:1.5;max-width:640px}
.sw-meta{display:flex;gap:18px;flex-wrap:wrap;margin-top:14px;padding-bottom:18px;border-bottom:1px solid var(--hair)}
.sw-meta-i{display:flex;flex-direction:column;gap:2px}
.sw-meta-k{font-size:10.5px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:var(--ink-3)}
.sw-meta-v{font-size:13px;font-weight:600}
.sw-est{font-size:11px;color:var(--ink-3);font-weight:500}

/* spine */
.sw-spine{position:relative;margin-top:22px;padding-left:30px}
.sw-line{position:absolute;left:11px;top:8px;bottom:30px;width:2px;background:var(--hair)}
.sw-node{position:relative;margin-bottom:14px;animation:sw-in .35s ease both}
@keyframes sw-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.sw-nodedot{position:absolute;left:-30px;top:16px;width:24px;height:24px;border-radius:50%;
  background:var(--surface);border:2px solid var(--hair);display:grid;place-items:center;z-index:2;color:var(--ink-3)}
.sw-nodedot svg{width:12px;height:12px}
.sw-node[data-st="settled"] .sw-nodedot{border-color:var(--accent);background:var(--accent);color:#fff}
.sw-node[data-st="edge"] .sw-nodedot{border-color:var(--accent);color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}
.sw-node[data-st="gate"] .sw-nodedot{border-color:var(--amber);color:var(--amber);box-shadow:0 0 0 4px var(--amber-soft)}
.sw-node[data-st="await"] .sw-nodedot{border-color:var(--amber);color:var(--amber)}
.sw-node[data-st="done"] .sw-nodedot{border-color:var(--green);background:var(--green);color:#fff}
.sw-node[data-st="recomputing"] .sw-nodedot{border-color:var(--accent);color:var(--accent)}
.sw-node[data-st="recomputing"] .sw-nodedot svg{animation:sw-spin 1s linear infinite}
@keyframes sw-spin{to{transform:rotate(360deg)}}
.sw-card{background:var(--surface);border:1px solid var(--hair);border-radius:var(--r);box-shadow:var(--sh-1);
  padding:13px 15px;transition:opacity .25s,box-shadow .2s,border-color .2s}
.sw-node[data-st="edge"] .sw-card,.sw-node[data-st="gate"] .sw-card{box-shadow:var(--sh-2);border-color:rgba(10,109,255,.25)}
.sw-node[data-st="gate"] .sw-card{border-color:rgba(176,106,0,.3)}
.sw-node[data-st="invalid"] .sw-card{opacity:.42}
.sw-node[data-st="recomputing"] .sw-card{opacity:.55}
.sw-node[data-st="pending"] .sw-card{opacity:.7}
.sw-ntype{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3);display:flex;align-items:center;gap:7px}
.sw-ntype .sw-nconf{margin-left:auto;font-weight:600;letter-spacing:0;text-transform:none;color:var(--ink-3)}
.sw-ntitle{font-size:14px;font-weight:600;margin-top:5px;letter-spacing:-0.012em}
.sw-nbody{font-size:13px;color:var(--ink-2);margin-top:5px;line-height:1.5}
.sw-nsrc{display:flex;gap:6px;margin-top:9px;flex-wrap:wrap}

/* parts / message / ticket blocks */
.sw-parts{margin-top:10px;display:flex;flex-direction:column;gap:7px}
.sw-part{display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid var(--hair);border-radius:9px;background:var(--surface-2)}
.sw-part b{font-size:13px;font-weight:600}.sw-part .sw-spec{font-size:11.5px;color:var(--ink-3)}
.sw-part .sw-price{margin-left:auto;font-weight:600;font-size:13px}
.sw-amz{font-size:9.5px;font-weight:700;letter-spacing:.04em;color:var(--ink-3);border:1px solid var(--hair);border-radius:4px;padding:2px 5px}
.sw-bubble{margin-top:10px;background:var(--accent-soft);border-radius:12px 12px 12px 4px;padding:10px 13px;font-size:13px;color:var(--ink);line-height:1.5;max-width:520px}
.sw-bubble-to{font-size:11px;color:var(--ink-3);font-weight:600;margin-bottom:5px;display:flex;align-items:center;gap:6px}
.sw-reply{margin-top:10px;background:rgba(0,0,0,.04);border-radius:12px 12px 4px 12px;padding:10px 13px;font-size:13px;line-height:1.5;max-width:440px;margin-left:auto}
.sw-ticket{margin-top:10px;border:1px solid var(--hair);border-radius:10px;overflow:hidden}
.sw-tk-head{background:var(--surface-2);padding:8px 12px;font-size:11px;font-weight:700;letter-spacing:.04em;color:var(--ink-2);display:flex;align-items:center;gap:7px;border-bottom:1px solid var(--hair)}
.sw-tk-row{display:flex;padding:7px 12px;font-size:12.5px;border-bottom:1px solid var(--hair-2)}
.sw-tk-row:last-child{border-bottom:none}
.sw-tk-k{flex:0 0 96px;color:var(--ink-3);font-weight:600;font-size:11px;letter-spacing:.02em;text-transform:uppercase;padding-top:1px}
.sw-tk-v{font-weight:500}

/* node actions */
.sw-nact{display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap}
.sw-btn{font-size:12.5px;font-weight:600;padding:7px 13px;border-radius:9px;transition:.12s;display:inline-flex;align-items:center;gap:6px}
.sw-btn svg{width:14px;height:14px}
.sw-btn-pri{background:var(--accent);color:#fff;box-shadow:var(--sh-1)}.sw-btn-pri:hover{filter:brightness(1.06)}
.sw-btn-amber{background:var(--amber);color:#fff;box-shadow:var(--sh-1)}.sw-btn-amber:hover{filter:brightness(1.06)}
.sw-btn-red{background:var(--red);color:#fff;box-shadow:var(--sh-1)}.sw-btn-red:hover{filter:brightness(1.06)}
.sw-btn-ghost{color:var(--ink-2);background:rgba(0,0,0,.045)}.sw-btn-ghost:hover{background:rgba(0,0,0,.08);color:var(--ink)}
.sw-btn-text{color:var(--accent);padding:7px 6px}.sw-btn-text:hover{background:var(--accent-soft)}
.sw-recomp{font-size:12px;color:var(--accent);font-weight:600;display:flex;align-items:center;gap:6px}
.sw-recomp svg{animation:sw-spin 1s linear infinite;width:13px;height:13px}
.sw-settled-note{font-size:11.5px;color:var(--green);font-weight:600;display:inline-flex;align-items:center;gap:5px}

/* feedback */
.sw-fb{margin-top:11px;border-top:1px dashed var(--hair);padding-top:11px;animation:sw-in .2s ease both}
.sw-fb-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px}
.sw-chip{font-size:11.5px;font-weight:500;padding:5px 10px;border-radius:20px;border:1px solid var(--hair);color:var(--ink-2);transition:.12s}
.sw-chip:hover{border-color:var(--accent);color:var(--accent)}
.sw-chip[aria-pressed="true"]{background:var(--accent);color:#fff;border-color:var(--accent)}
.sw-ta{width:100%;border:1px solid var(--hair);border-radius:9px;padding:9px 11px;font-family:inherit;font-size:13px;
  resize:none;color:var(--ink);background:var(--surface-2)}
.sw-ta:focus{outline:none;border-color:var(--accent);background:var(--surface)}

/* sources & log rows */
.sw-srcrow{display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--hair-2)}
.sw-srcrow:last-child{border-bottom:none}
.sw-srcic{width:32px;height:32px;border-radius:9px;background:var(--surface-2);border:1px solid var(--hair);display:grid;place-items:center;color:var(--ink-2);flex:0 0 auto}
.sw-srcmain{flex:1;min-width:0}.sw-srcname{font-size:14px;font-weight:600}
.sw-srcscope{font-size:12px;color:var(--ink-2);margin-top:2px}
.sw-srcmeta{text-align:right;flex:0 0 auto}
.sw-conn{font-size:11.5px;font-weight:600;display:inline-flex;align-items:center;gap:5px}
.sw-fresh{font-size:11px;color:var(--ink-3);margin-top:3px}
.sw-sec-h{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3);margin:22px 4px 2px}
.sw-srcnote{font-size:12px;color:var(--ink-2);margin-top:5px;line-height:1.5;padding:0 18px 14px}

/* toast */
.sw-toast{position:absolute;bottom:88px;left:50%;transform:translateX(-50%);background:#1d1d1f;color:#fff;
  padding:11px 16px;border-radius:12px;box-shadow:var(--sh-pop);font-size:13px;font-weight:500;display:flex;
  align-items:center;gap:14px;z-index:50;animation:sw-toast-in .3s cubic-bezier(.2,.8,.2,1) both;max-width:560px}
@keyframes sw-toast-in{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}
.sw-toast button{color:#5aa9ff;font-weight:600;font-size:13px;white-space:nowrap}

/* ---- universal ask composer (pinned to the bottom of every screen) ---- */
.ask-bar{flex:0 0 auto;padding:11px 32px 16px;border-top:1px solid var(--hair);background:var(--surface-2)}
.ask-wrap{display:flex;align-items:flex-end;gap:9px;background:var(--surface);border:1px solid var(--hair);
  border-radius:16px;padding:8px 8px 8px 15px;box-shadow:var(--sh-1);transition:border-color .14s,box-shadow .14s}
.ask-wrap:focus-within{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}
.ask-input{flex:1;min-width:0;border:none;outline:none;resize:none;background:none;font-family:inherit;font-size:14px;
  line-height:1.5;color:var(--ink);max-height:120px;padding:5px 0}
.ask-input::placeholder{color:var(--ink-3)}
.ask-send{width:36px;height:36px;border-radius:11px;background:var(--accent);color:#fff;display:grid;place-items:center;
  flex:0 0 auto;box-shadow:var(--sh-1);transition:.12s}
.ask-send:disabled{opacity:.4;cursor:default}.ask-send:not(:disabled):hover{filter:brightness(1.07)}
.ask-hint{font-size:11px;color:var(--ink-3);margin:8px 4px 0;display:flex;gap:6px;align-items:center}
.ask-hint svg{flex:0 0 auto;color:var(--ink-3)}
.ask-hint b{font-weight:600;color:var(--ink-2)}

/* =================== loops-and-Moves additions =================== */

/* avatars */
.sw-av{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:10px;
  font-weight:700;letter-spacing:.02em;flex:0 0 auto;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
.sw-av.sm{width:20px;height:20px;font-size:8.5px}
.sw-av.lg{width:34px;height:34px;font-size:12px}
.sw-avstack{display:inline-flex;align-items:center}
.sw-avstack .sw-av{margin-left:-7px;box-shadow:0 0 0 2px var(--surface)}
.sw-avstack .sw-av:first-child{margin-left:0}

/* type / severity chips */
.sw-typechip{font-size:10.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;display:inline-flex;
  align-items:center;gap:5px;padding:3px 8px;border-radius:6px;background:rgba(0,0,0,.05);color:var(--ink-2)}
.sw-typechip svg{width:12px;height:12px}
.sw-sevdot{width:9px;height:9px;border-radius:50%;flex:0 0 auto;box-shadow:0 0 0 3px rgba(0,0,0,.04)}
.sw-prio{font-size:11px;font-weight:700;color:var(--ink-3);font-variant-numeric:tabular-nums;letter-spacing:.02em}
.sw-age{font-size:11px;color:var(--ink-3);font-weight:600;display:inline-flex;align-items:center;gap:4px;font-variant-numeric:tabular-nums}
.sw-age.is-overdue{color:var(--red)}
.sw-age.is-now{color:var(--amber)}

/* reactive interrupt banner (a fire comes to find you) */
.sw-fire{margin:14px 32px 0;border:1px solid rgba(192,57,43,.4);border-radius:var(--r-lg);overflow:hidden;
  background:linear-gradient(180deg,rgba(255,59,48,.07),rgba(255,59,48,.02));box-shadow:var(--sh-2);
  animation:sw-fire-in .4s cubic-bezier(.2,.8,.2,1) both}
@keyframes sw-fire-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.sw-fire-top{display:flex;align-items:center;gap:11px;padding:13px 16px}
.sw-fire-ic{width:30px;height:30px;border-radius:9px;background:var(--red);color:#fff;display:grid;place-items:center;flex:0 0 auto;
  box-shadow:0 0 0 4px var(--red-soft)}
.sw-fire-ic svg{animation:sw-pulse-ic 1.6s ease-in-out infinite}
@keyframes sw-pulse-ic{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
.sw-fire-main{flex:1;min-width:0}
.sw-fire-k{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--red);display:flex;align-items:center;gap:7px}
.sw-fire-t{font-size:15px;font-weight:600;letter-spacing:-0.015em;margin-top:2px}
.sw-fire-sub{font-size:12.5px;color:var(--ink-2);margin-top:3px}
.sw-fire-act{display:flex;gap:8px;flex:0 0 auto}

/* carrying loop rows */
.sw-loop-left{display:flex;align-items:center;gap:13px;flex:1;min-width:0}
.sw-loop-glyph{width:34px;height:34px;border-radius:10px;background:var(--surface-2);border:1px solid var(--hair);
  display:grid;place-items:center;color:var(--ink-2);flex:0 0 auto;position:relative}
.sw-loop-glyph svg{width:16px;height:16px}
.sw-loop-glyph .sw-sevdot{position:absolute;top:-3px;right:-3px;box-shadow:0 0 0 2px var(--surface)}
.sw-loop-meta{font-size:12px;color:var(--ink-2);margin-top:3px;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.sw-loop-meta .sep{color:var(--ink-3);opacity:.6}
.sw-with{display:inline-flex;align-items:center;gap:5px}

/* loop detail */
.sw-ld-head{display:flex;align-items:flex-start;gap:14px;padding:6px 0 0}
.sw-ld-glyph{width:42px;height:42px;border-radius:12px;background:var(--surface-2);border:1px solid var(--hair);
  display:grid;place-items:center;color:var(--ink-2);flex:0 0 auto}
.sw-ld-glyph svg{width:20px;height:20px}
.sw-ld-title{font-size:21px;font-weight:600;letter-spacing:-0.022em;line-height:1.2}
.sw-ld-ctx{font-size:13.5px;color:var(--ink-2);margin-top:8px;line-height:1.5;max-width:640px}
.sw-ld-acts{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 4px}

/* timeline */
.sw-tl{position:relative;margin-top:8px;padding-left:24px}
.sw-tl::before{content:"";position:absolute;left:6px;top:6px;bottom:8px;width:2px;background:var(--hair)}
.sw-tl-row{position:relative;padding:7px 0}
.sw-tl-dot{position:absolute;left:-24px;top:9px;width:14px;height:14px;border-radius:50%;background:var(--surface);
  border:2px solid var(--hair);display:grid;place-items:center}
.sw-tl-dot i{width:5px;height:5px;border-radius:50%;background:var(--ink-3)}
.sw-tl-row[data-kind="escalated"] .sw-tl-dot i,.sw-tl-row[data-kind="opened"] .sw-tl-dot i{background:var(--accent)}
.sw-tl-row[data-kind="sent"] .sw-tl-dot i{background:var(--amber)}
.sw-tl-row[data-kind="reply"] .sw-tl-dot i{background:var(--green)}
.sw-tl-when{font-size:11px;color:var(--ink-3);font-weight:600;font-variant-numeric:tabular-nums}
.sw-tl-label{font-size:13px;color:var(--ink);margin-top:1px}

/* numbers block (pitch) */
.sw-nums{margin-top:10px;border:1px solid var(--hair);border-radius:10px;overflow:hidden}
.sw-num{display:flex;align-items:baseline;gap:10px;padding:9px 13px;border-bottom:1px solid var(--hair-2)}
.sw-num:last-child{border-bottom:none}
.sw-num-l{font-size:12.5px;color:var(--ink-2);flex:1;min-width:0}
.sw-num-v{font-size:14px;font-weight:700;letter-spacing:-0.01em;font-variant-numeric:tabular-nums}
.sw-num-n{font-size:11px;color:var(--ink-3);flex:0 0 auto}
.sw-num.flag .sw-num-v{color:var(--red)}

/* brief / justification block */
.sw-brief{margin-top:10px;border:1px solid var(--hair);border-radius:10px;background:var(--surface-2);overflow:hidden}
.sw-brief-h{padding:8px 13px;font-size:11px;font-weight:700;letter-spacing:.04em;color:var(--ink-2);
  border-bottom:1px solid var(--hair);display:flex;align-items:center;gap:7px}
.sw-brief-body{padding:11px 13px}
.sw-brief-sec{margin-bottom:11px}.sw-brief-sec:last-child{margin-bottom:0}
.sw-brief-sh{font-size:11px;font-weight:700;color:var(--ink-3);letter-spacing:.02em;margin-bottom:5px}
.sw-brief-li{font-size:12.5px;color:var(--ink);line-height:1.5;padding-left:15px;position:relative;margin-top:3px}
.sw-brief-li::before{content:"";position:absolute;left:3px;top:8px;width:4px;height:4px;border-radius:50%;background:var(--ink-3)}

/* status update (audience-aware send to a group) */
.sw-status{margin-top:10px;border:1px solid rgba(176,106,0,.3);border-radius:12px;overflow:hidden;background:var(--surface)}
.sw-status-h{padding:9px 13px;background:var(--amber-soft);font-size:13px;font-weight:700;color:var(--ink);letter-spacing:-0.01em;display:flex;align-items:center;gap:8px}
.sw-status-b{padding:11px 13px;font-size:13px;color:var(--ink-2);line-height:1.55}

/* reassign (delegate) */
.sw-reassign{margin-top:10px;display:flex;align-items:center;gap:11px;border:1px solid var(--hair);border-radius:10px;padding:11px 13px;background:var(--surface-2)}
.sw-reassign-arrow{color:var(--ink-3);flex:0 0 auto}
.sw-reassign-who{display:flex;align-items:center;gap:7px}
.sw-reassign-name{display:block;font-size:13px;font-weight:600}
.sw-reassign-reason{display:block;font-size:11.5px;color:var(--ink-3);margin-top:1px}

/* audience gate banner inside a high-stakes send node */
.sw-aud{margin-top:10px;display:flex;align-items:center;gap:9px;border:1px solid rgba(176,106,0,.3);background:var(--amber-soft);
  border-radius:10px;padding:9px 12px}
.sw-aud svg{color:var(--amber);flex:0 0 auto}
.sw-aud b{font-size:12.5px;font-weight:700}
.sw-aud span{font-size:12px;color:var(--ink-2)}

/* meetings */
.sw-mt-when{font-size:11.5px;color:var(--ink-3);font-weight:600;flex:0 0 auto}
.sw-mt-sec{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
@media(max-width:900px){.sw-mt-sec{grid-template-columns:1fr}}
.sw-card-lg{background:var(--surface);border:1px solid var(--hair);border-radius:var(--r-lg);box-shadow:var(--sh-1);padding:16px 18px}
.sw-card-lg h3{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3);margin:0 0 11px;display:flex;align-items:center;gap:7px}
.sw-li{font-size:13px;color:var(--ink);line-height:1.5;padding-left:17px;position:relative;margin-top:8px}
.sw-li:first-of-type{margin-top:0}
.sw-li::before{content:"";position:absolute;left:4px;top:8px;width:5px;height:5px;border-radius:50%;background:var(--accent)}
.sw-commit{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid var(--hair-2)}
.sw-commit:last-child{border-bottom:none}
.sw-commit-main{flex:1;min-width:0}
.sw-commit-t{font-size:13.5px;font-weight:500;letter-spacing:-0.01em}
.sw-commit-who{font-size:11.5px;color:var(--ink-3);margin-top:2px;display:flex;align-items:center;gap:6px}
.sw-fanned{font-size:10.5px;font-weight:700;color:var(--green);display:inline-flex;align-items:center;gap:4px;letter-spacing:.02em}
.sw-decision{font-size:13px;color:var(--ink);line-height:1.5;padding:9px 0;border-bottom:1px solid var(--hair-2);display:flex;gap:9px}
.sw-decision:last-child{border-bottom:none}
.sw-decision svg{color:var(--green);flex:0 0 auto;margin-top:2px}

/* roadmap */
.sw-rm-row{display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--hair-2);width:100%;text-align:left;transition:background .12s;position:relative}
.sw-rm-row:last-child{border-bottom:none}.sw-rm-row:hover{background:#fafafc}
.sw-rm-date{flex:0 0 64px;font-size:12px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}
.sw-rm-main{flex:1;min-width:0}
.sw-rm-name{font-size:14px;font-weight:600;letter-spacing:-0.012em;display:flex;align-items:center;gap:9px}
.sw-rm-note{font-size:12px;color:var(--ink-2);margin-top:3px}
.sw-rm-dep{font-size:10.5px;font-weight:600;color:var(--ink-3);background:rgba(0,0,0,.045);border-radius:5px;padding:2px 7px;display:inline-flex;align-items:center;gap:4px}
.sw-rm-status{font-size:11.5px;font-weight:700;display:inline-flex;align-items:center;gap:6px;flex:0 0 auto}

/* memory */
.sw-mem{display:flex;align-items:flex-start;gap:11px;padding:12px 18px;border-bottom:1px solid var(--hair-2)}
.sw-mem:last-child{border-bottom:none}
.sw-mem-ic{width:28px;height:28px;border-radius:8px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;flex:0 0 auto}
.sw-mem-t{font-size:13.5px;font-weight:600;letter-spacing:-0.01em}
.sw-mem-l{font-size:11.5px;color:var(--ink-3);margin-top:2px}
.sw-mem-kind{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-3);
  border:1px solid var(--hair);border-radius:5px;padding:2px 6px;flex:0 0 auto;margin-left:auto}

/* =========================== vault (Obsidian) =========================== */
.vt-wrap{flex:1;min-width:0;display:flex;min-height:0;overflow:hidden}

/* tree */
.vt-tree{width:262px;flex:0 0 262px;border-right:1px solid var(--hair);background:var(--surface-2);display:flex;flex-direction:column;min-height:0}
.vt-tree-head{display:flex;align-items:center;justify-content:space-between;padding:16px 14px 8px}
.vt-tree-title{font-size:13px;font-weight:700;letter-spacing:-0.01em}
.vt-tree-acts{display:flex;gap:2px}
.vt-iconbtn{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;color:var(--ink-2);transition:.12s}
.vt-iconbtn:hover{background:rgba(0,0,0,.06);color:var(--ink)}
.vt-iconbtn.sm{width:22px;height:22px;border-radius:6px}
.vt-search{display:flex;align-items:center;gap:7px;margin:0 12px 8px;padding:6px 9px;border:1px solid var(--hair);border-radius:8px;background:var(--surface);color:var(--ink-3)}
.vt-search input{flex:1;min-width:0;border:none;outline:none;background:none;font-family:inherit;font-size:12.5px;color:var(--ink)}
.vt-tree-body{flex:1;overflow-y:auto;padding:2px 8px 10px}
.vt-tree-body::-webkit-scrollbar{width:8px}.vt-tree-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.13);border-radius:8px;border:2px solid var(--surface-2)}
.vt-tree-body.vt-droproot{background:var(--accent-soft);border-radius:10px}
.vt-tree-foot{padding:9px 14px;border-top:1px solid var(--hair);font-size:11px;color:var(--ink-3);font-weight:600;display:flex;align-items:center;gap:7px;font-variant-numeric:tabular-nums}

.vt-row{display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:7px;cursor:pointer;position:relative;transition:background .1s;user-select:none}
.vt-row:hover{background:rgba(0,0,0,.045)}
.vt-row.is-sel{background:var(--accent-soft)}
.vt-row.is-sel .vt-name{color:var(--accent);font-weight:600}
.vt-row.vt-drop{background:var(--accent-soft);box-shadow:inset 0 0 0 1.5px var(--accent)}
.vt-twist{color:var(--ink-3);flex:0 0 auto;transition:transform .14s}
.vt-twist.open{transform:rotate(90deg)}
.vt-twist-sp{width:13px;flex:0 0 auto}
.vt-fic{flex:0 0 auto;color:var(--ink-3)}
.vt-name{font-size:13px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.vt-row-acts{display:none;gap:1px;flex:0 0 auto}
.vt-row:hover .vt-row-acts{display:flex}
.vt-rename{flex:1;min-width:0;border:1px solid var(--accent);border-radius:6px;padding:2px 6px;font-family:inherit;font-size:13px;outline:none;background:var(--surface);color:var(--ink)}

/* editor */
.vt-pane{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0;background:var(--canvas)}
.vt-editor{flex:1;display:flex;flex-direction:column;min-height:0}
.vt-edhead{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 28px 12px;border-bottom:1px solid var(--hair)}
.vt-crumbs{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--ink-3);min-width:0;flex-wrap:wrap}
.vt-crumb{white-space:nowrap}
.vt-crumb.cur{color:var(--ink);font-weight:600}
.vt-crumb-sep{color:var(--ink-3);opacity:.5}
.vt-modes{display:inline-flex;background:#e9e9ed;border-radius:8px;padding:2px;gap:2px;flex:0 0 auto}
.vt-modes button{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:500;color:var(--ink-2);padding:4px 11px;border-radius:6px;transition:.12s}
.vt-modes button.on{background:var(--surface);color:var(--ink);box-shadow:var(--sh-1);font-weight:600}
.vt-edbody{flex:1;overflow-y:auto;min-height:0}
.vt-edbody::-webkit-scrollbar{width:9px}.vt-edbody::-webkit-scrollbar-thumb{background:rgba(0,0,0,.14);border-radius:9px;border:2px solid var(--canvas)}
.vt-cm{height:100%}
.vt-cm .cm-editor{height:100%}
.vt-read{max-width:760px;margin:0 auto;padding:26px 32px 70px}
.vt-doc-title{font-size:30px;font-weight:700;letter-spacing:-0.03em;line-height:1.1;margin:0 0 12px}
.vt-fm{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px}
.vt-fm-pill{font-size:11px;font-weight:600;padding:3px 9px;border-radius:6px;background:var(--surface);border:1px solid var(--hair);color:var(--ink-2)}
.vt-fm-pill[data-k="status"]{color:var(--amber);border-color:rgba(176,106,0,.3);background:var(--amber-soft)}
.vt-tag{font-size:11px;font-weight:600;color:var(--accent);background:var(--accent-soft);border-radius:6px;padding:3px 9px}
.vt-edfoot{display:flex;align-items:center;justify-content:space-between;padding:8px 28px;border-top:1px solid var(--hair);font-size:11px;color:var(--ink-3);font-weight:600}
.vt-indexed{display:inline-flex;align-items:center;gap:5px;color:var(--green)}

/* backlinks */
.vt-backlinks{margin-top:40px;padding-top:18px;border-top:1px solid var(--hair)}
.vt-bl-h{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-3);display:flex;align-items:center;gap:7px;margin-bottom:9px}
.vt-bl{display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:9px 11px;border:1px solid var(--hair);border-radius:9px;background:var(--surface);color:var(--ink);font-size:13px;font-weight:500;margin-bottom:6px;transition:.12s}
.vt-bl:hover{border-color:var(--accent);color:var(--accent)}
.vt-bl svg{color:var(--ink-3)}
.vt-bl:hover svg{color:var(--accent)}
.vt-bl-empty{font-size:12.5px;color:var(--ink-3)}

/* binary file viewer */
.vt-binary{text-align:center;max-width:420px;padding:30px}
.vt-binary-ic{display:grid;place-items:center;width:74px;height:74px;border-radius:18px;background:var(--surface);border:1px solid var(--hair);margin:0 auto 16px;box-shadow:var(--sh-1)}
.vt-binary-name{font-size:16px;font-weight:600;letter-spacing:-0.01em}
.vt-binary-meta{font-size:12px;color:var(--ink-3);margin-top:3px;font-weight:600}
.vt-binary-note{font-size:13px;color:var(--ink-2);line-height:1.55;margin:14px 0 16px}

/* -------- markdown prose -------- */
.md-doc{font-size:14.5px;line-height:1.7;color:var(--ink)}
.md-h{font-weight:700;letter-spacing:-0.02em;line-height:1.25;margin:26px 0 8px}
.md-h1{font-size:23px}.md-h2{font-size:19px}.md-h3{font-size:16px}.md-h4{font-size:14px}.md-h5,.md-h6{font-size:13px;color:var(--ink-2)}
.md-doc > .md-h:first-child{margin-top:0}
.md-p{margin:11px 0}
.md-ul,.md-ol{margin:11px 0;padding-left:24px}
.md-ul li,.md-ol li{margin:5px 0}
.md-ul{list-style:disc}.md-ol{list-style:decimal}
.md-task{list-style:none;display:flex;align-items:flex-start;gap:9px;margin-left:-20px}
.md-check{width:17px;height:17px;border-radius:5px;border:1.5px solid var(--ink-3);flex:0 0 auto;display:grid;place-items:center;font-size:11px;color:#fff;margin-top:2px}
.md-check.on{background:var(--green);border-color:var(--green)}
.md-task-done{color:var(--ink-3);text-decoration:line-through}
.md-quote{margin:14px 0;padding:2px 16px;border-left:3px solid var(--accent);color:var(--ink-2);background:var(--accent-soft);border-radius:0 8px 8px 0}
.md-quote .md-p{margin:8px 0}
.md-callout{margin:14px 0;border:1px solid var(--hair);border-left:3px solid var(--accent);border-radius:0 10px 10px 0;
  padding:11px 14px;background:var(--accent-soft)}
.md-callout-h{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;letter-spacing:-0.01em;color:var(--accent)}
.md-callout-h svg{flex:0 0 auto}
.md-callout-b{margin-top:6px;color:var(--ink)}
.md-callout-b .md-p:first-child{margin-top:0}.md-callout-b .md-p:last-child{margin-bottom:0}
.md-callout-warning{border-left-color:var(--amber);background:var(--amber-soft)}
.md-callout-warning .md-callout-h{color:var(--amber)}
.md-callout-danger{border-left-color:var(--red);background:var(--red-soft)}
.md-callout-danger .md-callout-h{color:var(--red)}
.md-callout-tip,.md-callout-hint{border-left-color:var(--green);background:var(--green-soft)}
.md-callout-tip .md-callout-h,.md-callout-hint .md-callout-h{color:var(--green)}
.md-callout-question{border-left-color:#7b5cff;background:rgba(123,92,255,.1)}
.md-callout-question .md-callout-h{color:#7b5cff}
.md-pre{margin:14px 0;background:#1d1d1f;border-radius:10px;padding:13px 15px;overflow:auto;position:relative}
.md-pre code{font-family:var(--mono);font-size:12.5px;line-height:1.6;color:#e6e6ea;white-space:pre}
.md-pre-lang{position:absolute;top:8px;right:12px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#88889a}
.md-code-inline{font-family:var(--mono);font-size:.88em;background:rgba(0,0,0,.06);padding:1.5px 5px;border-radius:5px;color:var(--ink)}
.md-link{color:var(--accent);text-decoration:none;border-bottom:1px solid var(--accent-soft)}
.md-link:hover{border-bottom-color:var(--accent)}
.md-wiki{color:var(--accent);font-weight:500;background:var(--accent-soft);padding:1px 6px;border-radius:5px;font-size:.95em;transition:.12s}
.md-wiki:hover{background:var(--accent);color:#fff}
.md-wiki::before{content:"[[";opacity:.4;font-weight:400}
.md-wiki::after{content:"]]";opacity:.4;font-weight:400}
.md-mark{background:rgba(255,214,10,.4);border-radius:3px;padding:0 3px;color:var(--ink)}
.md-hr{border:none;border-top:1px solid var(--hair);margin:20px 0}
.md-table{border-collapse:collapse;margin:14px 0;font-size:13px;width:100%;border:1px solid var(--hair);border-radius:8px;overflow:hidden}
.md-table th,.md-table td{border-bottom:1px solid var(--hair-2);border-right:1px solid var(--hair-2);padding:7px 12px;text-align:left}
.md-table th{background:var(--surface-2);font-weight:700;font-size:11px;letter-spacing:.02em;text-transform:uppercase;color:var(--ink-2)}
.md-table tr:last-child td{border-bottom:none}
.md-table th:last-child,.md-table td:last-child{border-right:none}

/* embeddings / RAG (Sources) */
.sw-embed{display:flex;align-items:center;gap:12px;padding:11px 18px;border-bottom:1px solid var(--hair-2);width:100%;text-align:left;transition:background .12s}
.sw-embed:last-child{border-bottom:none}.sw-embed:hover{background:#fafafc}
.sw-embed-radio{width:16px;height:16px;border-radius:50%;border:2px solid var(--hair);flex:0 0 auto;display:grid;place-items:center}
.sw-embed.on .sw-embed-radio{border-color:var(--accent)}
.sw-embed.on .sw-embed-radio::after{content:"";width:8px;height:8px;border-radius:50%;background:var(--accent)}
.sw-embed-main{flex:1;min-width:0}
.sw-embed-name{font-size:13.5px;font-weight:600}
.sw-embed-where{font-size:11.5px;color:var(--ink-3);margin-top:2px}
.sw-embed-dims{font-size:11px;color:var(--ink-3);font-weight:600;font-variant-numeric:tabular-nums;flex:0 0 auto}

/* RAG citations (vault retrieval in a spine node) */
.sw-cites{margin-top:10px;display:flex;flex-direction:column;gap:7px}
.sw-cite{border:1px solid var(--hair);border-radius:9px;padding:9px 11px;background:var(--surface-2)}
.sw-cite-top{display:flex;align-items:center;gap:7px}
.sw-cite-note{font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:6px}
.sw-cite-note svg{color:var(--accent);width:13px;height:13px}
.sw-cite-score{margin-left:auto;font-size:10.5px;font-weight:700;color:var(--green);font-variant-numeric:tabular-nums;
  background:var(--green-soft);border-radius:5px;padding:2px 6px}
.sw-cite-snip{font-size:12px;color:var(--ink-2);margin-top:5px;line-height:1.5;font-style:italic}

/* =================== redesigned chrome (no hero headers) =================== */

/* brand row now carries the live indicator + notification bell on the right */
.sw-brand{justify-content:flex-start}
.sw-brand-tools{margin-left:auto;display:flex;align-items:center;gap:6px}
.sw-bell{position:relative;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--ink-2);transition:background .12s,color .12s}
.sw-bell:hover{background:rgba(0,0,0,.05);color:var(--ink)}
.sw-bell svg{width:17px;height:17px}
.sw-bell[aria-expanded="true"]{background:rgba(0,0,0,.06);color:var(--ink)}
.sw-badge{position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;padding:0 4px;border-radius:9px;
  background:var(--red);color:#fff;font-size:10px;font-weight:700;display:grid;place-items:center;
  box-shadow:0 0 0 2px var(--surface-2);font-variant-numeric:tabular-nums}

/* notification center popover, anchored under the bell */
@keyframes sw-pop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.sw-topbell{position:absolute;top:16px;right:18px;z-index:70}
.sw-native .sw-topbell{top:40px;right:22px}
.sw-notif-pop{position:absolute;z-index:90;top:44px;right:0;left:auto;width:344px;max-height:62vh;overflow-y:auto;
  background:var(--surface);border:1px solid var(--hair);border-radius:14px;box-shadow:var(--sh-pop);
  padding:6px;animation:sw-pop .14s ease both}
.sw-notif-pop::-webkit-scrollbar{width:8px}.sw-notif-pop::-webkit-scrollbar-thumb{background:rgba(0,0,0,.14);border-radius:8px;border:2px solid var(--surface)}
.sw-notif-head{display:flex;align-items:center;justify-content:space-between;padding:7px 9px 7px}
.sw-notif-head b{font-size:13px;font-weight:700;letter-spacing:-0.01em}
.sw-notif-clear{font-size:11.5px;color:var(--accent);font-weight:600;padding:3px 6px;border-radius:6px}
.sw-notif-clear:hover{background:var(--accent-soft)}
.sw-notif-item{display:flex;gap:10px;padding:10px;border-radius:10px;width:100%;text-align:left;align-items:flex-start;transition:background .12s;position:relative}
.sw-notif-item:hover{background:rgba(0,0,0,.045)}
.sw-notif-dot{width:9px;height:9px;border-radius:50%;margin-top:4px;flex:0 0 auto;box-shadow:0 0 0 3px rgba(0,0,0,.04)}
.sw-notif-main{flex:1;min-width:0;display:flex;flex-direction:column}
.sw-notif-t{font-size:13px;font-weight:600;letter-spacing:-0.012em;line-height:1.35}
.sw-notif-b{font-size:12px;color:var(--ink-2);margin-top:3px;line-height:1.45}
.sw-notif-when{font-size:11px;color:var(--ink-3);margin-top:4px;font-variant-numeric:tabular-nums}
.sw-notif-unread{position:absolute;top:12px;right:11px;width:7px;height:7px;border-radius:50%;background:var(--accent)}
.sw-notif-empty{padding:30px 14px;text-align:center;color:var(--ink-3);font-size:12.5px}
.sw-notif-empty svg{display:block;margin:0 auto 8px;color:var(--ink-3)}

/* sidebar footer: collapsible Quick Info, then Settings pinned to the bottom */
.sw-rail-foot{margin-top:auto;padding:10px 4px 2px;border-top:1px solid var(--hair);display:flex;flex-direction:column;gap:8px}
.sw-quick{border:1px solid var(--hair);border-radius:10px;background:var(--surface);overflow:hidden}
.sw-quick-head{display:flex;align-items:center;gap:7px;width:100%;text-align:left;padding:8px 10px;
  font-size:11.5px;font-weight:600;color:var(--ink-2);transition:color .12s}
.sw-quick-head:hover{color:var(--ink)}
.sw-quick-head>svg:first-child{width:13px;height:13px;color:var(--ink-3);flex:0 0 auto}
.sw-quick-chev{margin-left:auto;color:var(--ink-3);transition:transform .16s}
.sw-quick[data-open="true"] .sw-quick-chev{transform:rotate(180deg)}
.sw-quick-body{padding:0 10px 10px;animation:sw-quick-in .18s ease both}
@keyframes sw-quick-in{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:none}}
.sw-quick-text{font-size:11.5px;color:var(--ink-2);line-height:1.5}
.sw-quick-demo{margin-top:8px;font-size:10px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:var(--ink-3)}

/* content top spacing now that the hero header is gone */
.sw-main{padding-top:8px}
.sw-seg{margin-top:16px}

/* ---- embedded in the native macOS shell ---- */
.sw-native, .sw-native body{background:transparent}
.sw-native #root{display:block;padding:0;min-height:100%}
/* Only the sidebar is a floating rounded card; it sits in a thin margin on the
   window background so the OS traffic lights (fixed at the window's top-left)
   land inside it. The main body is NOT a nested container — it's transparent and
   shares the window background, so the content reads as one continuous surface.
   The 34px drag strip overlays the top, so both columns pad their tops to clear it. */
.sw-native .sw-root{max-width:none;width:100%;height:100vh;border-radius:0;border:none;box-shadow:none;
  background:var(--canvas);padding:0;gap:0}
.sw-native .sw-rail{margin:9px;padding-top:26px;border:1px solid var(--hair);border-radius:13px;box-shadow:var(--sh-1)}
.sw-native .sw-main{padding-top:34px;background:transparent}

/* Native-app feel: chrome (nav, labels, list rows, cards, headers) isn't
   selectable and shows the arrow cursor; only genuine content and inputs are
   selectable — text fields, the markdown editor, the note reader, and Studio
   chat. Scoped to the embedded shell so the browser stays normally selectable. */
.sw-native{user-select:none;-webkit-user-select:none}
.sw-native .sw-root{cursor:default}
.sw-native input,.sw-native textarea,.sw-native [contenteditable="true"],
.sw-native .cm-editor,.sw-native .cm-content,.sw-native .md-doc,
.sw-native .vt-read,.sw-native .st-say,.sw-native .st-user div{
  -webkit-user-select:text;user-select:text;cursor:auto}

/* ---- one consistent page header for every list screen ---- */
.sw-phead{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:16px 50px 14px 0;flex-wrap:wrap}
.sw-phead-main{min-width:0}
.sw-phead-t{font-size:18px;font-weight:600;letter-spacing:-0.022em;line-height:1.2;margin:0}
.sw-phead-s{font-size:12.5px;color:var(--ink-2);line-height:1.5;margin:4px 0 0;max-width:600px}
.sw-phead-right{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding-top:1px}
.sw-phead-right .sw-seg{margin:0}

/* =============================== clusters (home board) =============================== */
.cl-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:18px 48px 2px 0;flex-wrap:wrap}
.cl-search{display:flex;align-items:center;gap:9px;width:330px;max-width:44vw;padding:9px 13px;border:1px solid var(--hair);
  border-radius:11px;background:var(--surface);box-shadow:var(--sh-1);color:var(--ink-3);transition:border-color .14s,box-shadow .14s}
.cl-search:focus-within{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}
.cl-search svg{width:16px;height:16px;flex:0 0 auto}
.cl-search input{flex:1;min-width:0;border:none;outline:none;background:none;font-family:inherit;font-size:13px;color:var(--ink)}
.cl-search input::placeholder{color:var(--ink-3)}
.cl-search kbd{font-family:var(--mono);font-size:10px;color:var(--ink-3);border:1px solid var(--hair);border-radius:5px;padding:1px 5px;background:var(--surface-2);flex:0 0 auto}

.cl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:18px;align-items:start}
.cl-card{display:flex;flex-direction:column;text-align:left;width:100%;padding:16px 17px 14px;position:relative;overflow:hidden;
  background:var(--surface);border:1px solid var(--hair);border-radius:var(--r-lg);box-shadow:var(--sh-1);
  transition:transform .16s cubic-bezier(.2,.8,.2,1),box-shadow .16s,border-color .16s}
.cl-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--cl,var(--accent));opacity:.9}
.cl-card:hover{transform:translateY(-2px);box-shadow:var(--sh-2);border-color:color-mix(in srgb,var(--cl) 38%,var(--hair))}
.cl-card.is-review::before{background:var(--amber)}
.cl-card.is-review{border-color:rgba(176,106,0,.3);background:linear-gradient(180deg,var(--amber-soft),transparent 62%)}
.cl-card-top{display:flex;align-items:center;gap:8px;margin-bottom:11px}
.cl-glyph{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex:0 0 auto;
  background:color-mix(in srgb,var(--cl) 14%,var(--surface));color:var(--cl,var(--accent));
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--cl) 24%,transparent)}
.cl-glyph svg{width:16px;height:16px}
.cl-kind{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3)}
.cl-pin{color:var(--ink-3);display:grid;place-items:center}.cl-pin svg{width:12px;height:12px}
.cl-auto{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:var(--ink-2);
  background:rgba(0,0,0,.05);border-radius:20px;padding:2px 8px;font-variant-numeric:tabular-nums}
.cl-auto svg{width:11px;height:11px;color:var(--accent)}
.cl-auto.warn{color:var(--amber);background:var(--amber-soft)}.cl-auto.warn svg{color:var(--amber)}
.cl-fire{color:var(--red);display:grid;place-items:center}.cl-fire:not(.after){margin-left:auto}.cl-fire.after{margin-left:6px}
.cl-fire svg{width:14px;height:14px;animation:sw-pulse-ic 1.8s ease-in-out infinite}
.cl-name{font-size:15.5px;font-weight:600;letter-spacing:-0.018em;line-height:1.25}
.cl-summary{font-size:12.5px;color:var(--ink-2);line-height:1.5;margin-top:5px;min-height:37px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cl-stats{display:flex;align-items:center;gap:13px;margin-top:12px;flex-wrap:wrap}
.cl-stats span{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--ink-2);font-variant-numeric:tabular-nums}
.cl-stats svg{width:13px;height:13px;color:var(--ink-3)}
.cl-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:13px;padding-top:12px;border-top:1px solid var(--hair-2)}
.cl-activity{font-size:11px;font-weight:600;color:var(--ink-3);display:inline-flex;align-items:center;gap:5px;font-variant-numeric:tabular-nums}
.cl-activity svg{width:12px;height:12px}
.cl-review{font-size:11px;font-weight:700;color:var(--amber);display:inline-flex;align-items:center;gap:5px}
.cl-review svg{width:13px;height:13px}

/* cluster detail */
.cl-d-head{display:flex;align-items:flex-start;gap:15px;padding:6px 0 0}
.cl-d-glyph{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;flex:0 0 auto;
  background:color-mix(in srgb,var(--cl) 14%,var(--surface));color:var(--cl,var(--accent));
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--cl) 24%,transparent)}
.cl-d-glyph svg{width:22px;height:22px}
.cl-d-name{font-size:23px;font-weight:600;letter-spacing:-0.025em;line-height:1.15;display:flex;align-items:center;gap:10px}
.cl-d-summary{font-size:13.5px;color:var(--ink-2);margin-top:9px;line-height:1.5;max-width:640px}
.cl-gate{display:flex;align-items:center;gap:12px;margin:18px 0 2px;padding:11px 14px;border-radius:12px;
  border:1px solid rgba(176,106,0,.3);background:var(--amber-soft)}
.cl-gate.ok{border-color:var(--hair);background:var(--surface-2)}
.cl-gate-ic{flex:0 0 auto;display:grid;place-items:center;color:var(--amber)}
.cl-gate.ok .cl-gate-ic{color:var(--accent)}
.cl-gate-main{flex:1;min-width:0}
.cl-gate-t{font-size:13px;font-weight:600;letter-spacing:-0.01em}
.cl-gate-s{font-size:12px;color:var(--ink-2);margin-top:2px;line-height:1.45}
.cl-d-search{display:flex;align-items:center;gap:9px;margin:18px 0 2px;padding:10px 14px;border:1px solid var(--hair);
  border-radius:11px;background:var(--surface);box-shadow:var(--sh-1);color:var(--ink-3);transition:border-color .14s,box-shadow .14s}
.cl-d-search:focus-within{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}
.cl-d-search svg{width:16px;height:16px;flex:0 0 auto}
.cl-d-search input{flex:1;min-width:0;border:none;outline:none;background:none;font-family:inherit;font-size:13px;color:var(--ink)}
.cl-d-search input::placeholder{color:var(--ink-3)}
.cl-d-scope{font-size:10px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--accent);
  background:var(--accent-soft);border-radius:6px;padding:3px 8px;flex:0 0 auto}

/* cluster member rows */
.cl-mrow{display:flex;align-items:center;gap:13px;padding:12px 16px;width:100%;text-align:left;
  border-bottom:1px solid var(--hair-2);transition:background .12s}
.cl-mrow:last-child{border-bottom:none}.cl-mrow:hover{background:#fafafc}
.cl-mglyph{width:32px;height:32px;border-radius:9px;background:var(--surface-2);border:1px solid var(--hair);
  display:grid;place-items:center;color:var(--ink-2);flex:0 0 auto}
.cl-mglyph svg{width:15px;height:15px}
.cl-mmain{flex:1;min-width:0}
.cl-mtitle{font-size:13.5px;font-weight:600;letter-spacing:-0.01em;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cl-mmeta{font-size:11.5px;color:var(--ink-3);margin-top:3px;display:flex;align-items:center;gap:7px}
.cl-mright{flex:0 0 auto;display:flex;align-items:center;gap:11px}
.cl-people-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:1px;padding:6px}
.cl-person{display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:10px;transition:background .12s}
.cl-person:hover{background:#fafafc}
.cl-person-n{font-size:13px;font-weight:600;display:block}
.cl-person-r{font-size:11px;color:var(--ink-3);margin-top:1px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cl-art{display:flex;align-items:center;gap:12px;padding:13px 16px;width:100%;text-align:left;border-bottom:1px solid var(--hair-2)}
.cl-art:last-child{border-bottom:none}
.cl-art-ic{width:34px;height:34px;border-radius:9px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;flex:0 0 auto}
.cl-art-t{font-size:13.5px;font-weight:600;display:block}
.cl-art-k{font-size:11px;color:var(--ink-3);margin-top:2px;display:block}
`;
