import React, { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

/* ============================================================================
   AskBar — the chat composer that follows you onto every screen. Its placeholder
   and the context it carries are derived from whatever screen you're on (computed
   in Steward.jsx as `askCtx`). Submitting opens a fresh, grounded Studio session:
   the screen context is prepended to the model transcript, hidden from the visible
   bubble. Studio keeps its own composer, so this is hidden there.
   ========================================================================== */
export default function AskBar({ placeholder, label, onAsk }) {
  const [text, setText] = useState("");
  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    onAsk(t);
  };
  return (
    <div className="ask-bar">
      <div className="ask-wrap">
        <textarea
          className="ask-input" rows={1} value={text} placeholder={placeholder} aria-label="Ask Steward"
          onChange={(e) => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button className="ask-send" disabled={!text.trim()} onClick={send} aria-label="Ask Steward">
          <ArrowUp size={18} />
        </button>
      </div>
      <div className="ask-hint">
        <Sparkles size={12} /> Ask Steward — grounded in <b>{label}</b> · opens in Studio · Enter to send
      </div>
    </div>
  );
}
