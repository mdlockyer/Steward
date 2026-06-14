import React from "react";
import { Info, AlertTriangle, HelpCircle, Lightbulb, Flame } from "lucide-react";

const CALLOUT = {
  note: { ic: Info }, info: { ic: Info }, warning: { ic: AlertTriangle },
  danger: { ic: Flame }, question: { ic: HelpCircle }, tip: { ic: Lightbulb }, hint: { ic: Lightbulb },
};

/* ============================================================================
   A compact, dependency-free Markdown → React renderer tuned for an Obsidian
   vault: headings, lists, task lists, blockquotes, fenced code, tables, rules,
   and inline bold/italic/code/strike/highlight/links/[[wikilinks]]. Wikilinks
   call back through onWikiLink so the editor can navigate the vault.
   ========================================================================== */

let keyN = 0;
const k = () => "md" + keyN++;

/* ------------------------------- inline ---------------------------------- */
export function renderInline(text, onWikiLink) {
  const out = [];
  let i = 0, buf = "";
  const flush = () => { if (buf) { out.push(buf); buf = ""; } };
  const push = (el) => { flush(); out.push(el); };

  while (i < text.length) {
    const rest = text.slice(i);

    // [[wikilink]] or [[link|alias]]
    let m = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(rest);
    if (m) {
      const target = m[1].trim(), label = (m[2] || m[1]).trim();
      push(<button key={k()} className="md-wiki" onClick={(e) => { e.preventDefault(); onWikiLink && onWikiLink(target); }}>{label}</button>);
      i += m[0].length; continue;
    }
    // [text](url)
    m = /^\[([^\]]+)\]\(([^)]+)\)/.exec(rest);
    if (m) {
      push(<a key={k()} className="md-link" href={m[2]} target="_blank" rel="noreferrer">{m[1]}</a>);
      i += m[0].length; continue;
    }
    // `code`
    m = /^`([^`]+)`/.exec(rest);
    if (m) { push(<code key={k()} className="md-code-inline">{m[1]}</code>); i += m[0].length; continue; }
    // **bold**
    m = /^\*\*([^*]+)\*\*/.exec(rest);
    if (m) { push(<strong key={k()}>{renderInline(m[1], onWikiLink)}</strong>); i += m[0].length; continue; }
    // ==highlight==
    m = /^==([^=]+)==/.exec(rest);
    if (m) { push(<mark key={k()} className="md-mark">{m[1]}</mark>); i += m[0].length; continue; }
    // ~~strike~~
    m = /^~~([^~]+)~~/.exec(rest);
    if (m) { push(<s key={k()}>{m[1]}</s>); i += m[0].length; continue; }
    // *italic* or _italic_
    m = /^\*([^*]+)\*/.exec(rest) || /^_([^_]+)_/.exec(rest);
    if (m && m[0][0] === rest[0]) { push(<em key={k()}>{renderInline(m[1], onWikiLink)}</em>); i += m[0].length; continue; }

    buf += text[i]; i += 1;
  }
  flush();
  return out;
}

/* -------------------------------- blocks --------------------------------- */
export function renderMarkdown(src, onWikiLink) {
  const body = stripFrontmatter(src);
  const lines = body.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    let line = lines[i];

    // blank
    if (!line.trim()) { i += 1; continue; }

    // fenced code
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const code = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i += 1; }
      i += 1; // closing fence
      blocks.push(<pre key={k()} className="md-pre"><code>{code.join("\n")}{lang ? <span className="md-pre-lang">{lang}</span> : null}</code></pre>);
      continue;
    }

    // heading
    let m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) {
      const lvl = m[1].length;
      const Tag = "h" + Math.min(lvl, 6);
      blocks.push(React.createElement(Tag, { key: k(), className: "md-h md-h" + lvl }, renderInline(m[2], onWikiLink)));
      i += 1; continue;
    }

    // horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) { blocks.push(<hr key={k()} className="md-hr" />); i += 1; continue; }

    // blockquote / callout (collect consecutive)
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, "")); i += 1; }
      const cm = /^\[!(\w+)\][+-]?\s*(.*)$/.exec(quote[0] || "");
      if (cm) {
        const type = cm[1].toLowerCase();
        const meta = CALLOUT[type] || CALLOUT.note;
        const Ic = meta.ic;
        const title = cm[2] || (type.charAt(0).toUpperCase() + type.slice(1));
        const rest = quote.slice(1).join("\n").trim();
        blocks.push(
          <div key={k()} className={"md-callout md-callout-" + type}>
            <div className="md-callout-h"><Ic size={14} /> {renderInline(title, onWikiLink)}</div>
            {rest && <div className="md-callout-b">{renderMarkdown(rest, onWikiLink)}</div>}
          </div>
        );
        continue;
      }
      blocks.push(<blockquote key={k()} className="md-quote">{renderMarkdown(quote.join("\n"), onWikiLink)}</blockquote>);
      continue;
    }

    // table
    if (/^\|.*\|/.test(line) && i + 1 < lines.length && /^\|?[\s:|-]+\|/.test(lines[i + 1])) {
      const head = splitRow(line);
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && /^\|.*\|/.test(lines[i])) { rows.push(splitRow(lines[i])); i += 1; }
      blocks.push(
        <table key={k()} className="md-table">
          <thead><tr>{head.map((c) => <th key={k()}>{renderInline(c, onWikiLink)}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={k()}>{r.map((c) => <td key={k()}>{renderInline(c, onWikiLink)}</td>)}</tr>)}</tbody>
        </table>
      );
      continue;
    }

    // lists (unordered / task / ordered) — collect a contiguous run
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const items = [];
      const ordered = /^\s*\d+\.\s+/.test(line);
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        const raw = lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, "");
        const task = /^\[( |x|X)\]\s+/.exec(raw);
        if (task) {
          const done = task[1].toLowerCase() === "x";
          items.push(<li key={k()} className="md-task"><span className={"md-check" + (done ? " on" : "")}>{done ? "✓" : ""}</span><span className={done ? "md-task-done" : ""}>{renderInline(raw.replace(/^\[( |x|X)\]\s+/, ""), onWikiLink)}</span></li>);
        } else {
          items.push(<li key={k()}>{renderInline(raw, onWikiLink)}</li>);
        }
        i += 1;
      }
      blocks.push(ordered
        ? <ol key={k()} className="md-ol">{items}</ol>
        : <ul key={k()} className="md-ul">{items}</ul>);
      continue;
    }

    // paragraph (collect until blank)
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|>|```|\s*([-*+]|\d+\.)\s|\|)/.test(lines[i]) && !/^(\*{3,}|-{3,}|_{3,})\s*$/.test(lines[i])) {
      para.push(lines[i]); i += 1;
    }
    blocks.push(<p key={k()} className="md-p">{renderInline(para.join(" "), onWikiLink)}</p>);
  }
  return blocks;
}

/* -------------------------------- helpers -------------------------------- */
function splitRow(line) {
  return line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

export function parseFrontmatter(src) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  if (!m) return {};
  const fm = {};
  m[1].split("\n").forEach((l) => {
    const idx = l.indexOf(":");
    if (idx === -1) return;
    const key = l.slice(0, idx).trim();
    let val = l.slice(idx + 1).trim();
    if (/^\[.*\]$/.test(val)) val = val.slice(1, -1).split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    else val = val.replace(/^["']|["']$/g, "");
    if (key) fm[key] = val;
  });
  return fm;
}
function stripFrontmatter(src) {
  return src.replace(/^---\n[\s\S]*?\n---\n?/, "");
}

/* collect [[wikilinks]] a note points at (for backlink computation) */
export function outboundLinks(src) {
  const out = [];
  const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let m;
  while ((m = re.exec(src))) out.push(m[1].trim());
  return out;
}
