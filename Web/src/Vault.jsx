import React, { useState, useMemo, useRef } from "react";
import {
  FileText, Folder, FolderOpen, ChevronRight, Plus, Search, Trash2, PenLine,
  FileType2, Sheet, Image as ImageIcon, File, Link2, Eye, Code2, Database,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { renderMarkdown, parseFrontmatter, outboundLinks } from "./markdown.jsx";
import { FILE_KIND, VAULT_INDEX } from "./data.js";
import { EmptyState } from "./components.jsx";

/* CodeMirror 6 (the engine Obsidian uses) for real markdown source editing —
   live syntax formatting, GFM, list continuation, fenced-code language
   highlighting — themed to the app's tokens. Defined once at module scope. */
const cmTheme = EditorView.theme({
  "&": { backgroundColor: "transparent", height: "100%", color: "var(--ink)", fontSize: "13.5px" },
  "&.cm-editor.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--ui)", lineHeight: "1.75", padding: "22px 0 64px", overflow: "auto" },
  ".cm-scroller::-webkit-scrollbar": { width: "9px" },
  ".cm-scroller::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,.14)", borderRadius: "9px", border: "2px solid var(--canvas)" },
  ".cm-content": { padding: "0 32px", maxWidth: "880px", caretColor: "var(--accent)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": { backgroundColor: "var(--accent-soft)" },
  ".cm-gutters": { display: "none" },
}, { dark: false });

const cmHighlight = HighlightStyle.define([
  { tag: t.heading1, fontSize: "1.55em", fontWeight: "700", lineHeight: "1.4" },
  { tag: t.heading2, fontSize: "1.3em", fontWeight: "700" },
  { tag: t.heading3, fontSize: "1.12em", fontWeight: "700" },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: "700" },
  { tag: t.strong, fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "var(--accent)", textDecoration: "underline" },
  { tag: t.url, color: "var(--ink-3)" },
  { tag: t.monospace, fontFamily: "var(--mono)", fontSize: "0.92em" },
  { tag: t.quote, color: "var(--ink-2)" },
  { tag: t.list, color: "var(--accent)" },
  { tag: [t.meta, t.processingInstruction, t.contentSeparator], color: "var(--ink-3)" },
]);

const CM_EXTENSIONS = [
  markdown({ base: markdownLanguage, codeLanguages: languages }),
  EditorView.lineWrapping,
  cmTheme,
  syntaxHighlighting(cmHighlight),
];
const CM_SETUP = {
  lineNumbers: false, foldGutter: false, highlightActiveLine: false,
  highlightActiveLineGutter: false, autocompletion: false, searchKeymap: false,
  bracketMatching: false, closeBrackets: false, rectangularSelection: false,
  highlightSelectionMatches: false, indentOnInput: true,
};

/* ============================================================================
   VAULT — an Obsidian-style markdown editor + viewer over the local vault.
   Left: a file tree with create / rename / delete and drag-to-move. Right: a
   reader/editor with [[wikilink]] navigation, frontmatter, and backlinks. The
   whole vault is indexed for RAG (see Sources) so Studio can query it.
   ========================================================================== */

const baseName = (n) => n.replace(/\.md$/i, "");
const fileIcon = (ext) =>
  ext === "md" ? FileText : ext === "pdf" ? FileType2 : ext === "xlsx" ? Sheet : ext === "png" ? ImageIcon : File;

export default function Vault({ vault, selectedId, onSelect, onEdit, onCreateFile, onCreateFolder, onRename, onDelete, onMove, onWikiLink }) {
  const [expanded, setExpanded] = useState(() => new Set(vault.filter((i) => i.type === "folder").map((i) => i.id)));
  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const childrenOf = useMemo(() => {
    const map = {};
    vault.forEach((i) => { (map[i.parentId || "root"] ||= []).push(i); });
    Object.values(map).forEach((arr) => arr.sort((a, b) =>
      a.type !== b.type ? (a.type === "folder" ? -1 : 1) : a.name.localeCompare(b.name)));
    return map;
  }, [vault]);

  const selected = vault.find((i) => i.id === selectedId) || null;
  const toggle = (id) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // descendant guard so a folder can't be dropped into itself
  const isDescendant = (maybeChild, ancestor) => {
    let cur = vault.find((i) => i.id === maybeChild);
    while (cur && cur.parentId) { if (cur.parentId === ancestor) return true; cur = vault.find((i) => i.id === cur.parentId); }
    return false;
  };
  const doDrop = (targetFolderId) => {
    if (!dragId) return;
    if (dragId === targetFolderId || isDescendant(targetFolderId, dragId)) { setDragId(null); setDropTarget(null); return; }
    onMove(dragId, targetFolderId);
    setDragId(null); setDropTarget(null);
  };

  const q = query.trim().toLowerCase();
  const matches = (i) => !q || i.name.toLowerCase().includes(q) || (i.content || "").toLowerCase().includes(q);

  return (
    <div className="vt-wrap">
      {/* ---- tree ---- */}
      <aside className="vt-tree" onDragOver={(e) => { e.preventDefault(); setDropTarget("root"); }}
        onDrop={(e) => { e.preventDefault(); doDrop(null); }}>
        <div className="vt-tree-head">
          <span className="vt-tree-title">Vault</span>
          <div className="vt-tree-acts">
            <button className="vt-iconbtn" title="New note" onClick={() => onCreateFile(null)}><Plus size={15} /></button>
            <button className="vt-iconbtn" title="New folder" onClick={() => onCreateFolder(null)}><Folder size={14} /></button>
          </div>
        </div>
        <div className="vt-search">
          <Search size={13} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes…" />
        </div>
        <div className={"vt-tree-body" + (dropTarget === "root" && dragId ? " vt-droproot" : "")}
          onDragLeave={() => setDropTarget(null)}>
          {(childrenOf.root || []).map((item) => (
            <TreeNode key={item.id} item={item} depth={0} childrenOf={childrenOf}
              expanded={expanded} toggle={toggle} selectedId={selectedId} onSelect={onSelect}
              matches={matches} q={q}
              renamingId={renamingId} setRenamingId={setRenamingId} onRename={onRename}
              onDelete={onDelete} onCreateFile={onCreateFile} onCreateFolder={onCreateFolder}
              dragId={dragId} setDragId={setDragId} dropTarget={dropTarget} setDropTarget={setDropTarget} doDrop={doDrop} />
          ))}
        </div>
        <div className="vt-tree-foot">
          <Database size={12} /> {VAULT_INDEX.notes} notes · {VAULT_INDEX.chunks} chunks indexed
        </div>
      </aside>

      {/* ---- editor ---- */}
      <section className="vt-pane">
        {selected ? <EditorPane key={selected.id} file={selected} vault={vault} onEdit={onEdit} onSelect={onSelect}
          onWikiLink={onWikiLink} onRename={onRename} /> : (
          <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
            <EmptyState icon={FileText} title="Open a note">Pick a file from the vault, or create one. Markdown renders live; every note is indexed for Studio.</EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------- tree node ------------------------------- */
function TreeNode({ item, depth, childrenOf, expanded, toggle, selectedId, onSelect, matches, q,
  renamingId, setRenamingId, onRename, onDelete, onCreateFile, onCreateFolder,
  dragId, setDragId, dropTarget, setDropTarget, doDrop }) {
  const isFolder = item.type === "folder";
  const kids = childrenOf[item.id] || [];
  const open = expanded.has(item.id);

  // when searching, hide non-matching files and empty folders
  if (q) {
    if (!isFolder && !matches(item)) return null;
    if (isFolder) {
      const anyMatch = (function scan(id) {
        return (childrenOf[id] || []).some((c) => c.type === "folder" ? scan(c.id) : matches(c));
      })(item.id);
      if (!anyMatch) return null;
    }
  }
  const Ic = isFolder ? (open ? FolderOpen : Folder) : fileIcon(item.ext);
  const renaming = renamingId === item.id;

  return (
    <div>
      <div
        className={"vt-row" + (selectedId === item.id ? " is-sel" : "") + (dropTarget === item.id && dragId && isFolder ? " vt-drop" : "")}
        style={{ paddingLeft: 8 + depth * 14 }}
        draggable={!renaming}
        onDragStart={(e) => { e.stopPropagation(); setDragId(item.id); }}
        onDragEnd={() => { setDragId(null); setDropTarget(null); }}
        onDragOver={isFolder ? (e) => { e.preventDefault(); e.stopPropagation(); setDropTarget(item.id); } : undefined}
        onDrop={isFolder ? (e) => { e.preventDefault(); e.stopPropagation(); doDrop(item.id); } : undefined}
        onClick={() => isFolder ? toggle(item.id) : onSelect(item.id)}>
        {isFolder
          ? <ChevronRight size={13} className={"vt-twist" + (open ? " open" : "")} />
          : <span className="vt-twist-sp" />}
        <Ic size={15} className="vt-fic" style={isFolder ? null : { color: (FILE_KIND[item.ext] || {}).color || "var(--ink-3)" }} />
        {renaming ? (
          <input className="vt-rename" autoFocus defaultValue={item.name}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => { onRename(item.id, e.target.value); setRenamingId(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { onRename(item.id, e.target.value); setRenamingId(null); } if (e.key === "Escape") setRenamingId(null); }} />
        ) : (
          <span className="vt-name">{isFolder ? item.name : baseName(item.name)}</span>
        )}
        {!renaming && (
          <span className="vt-row-acts" onClick={(e) => e.stopPropagation()}>
            {isFolder && <button className="vt-iconbtn sm" title="New note here" onClick={() => { if (!open) toggle(item.id); onCreateFile(item.id); }}><Plus size={12} /></button>}
            <button className="vt-iconbtn sm" title="Rename" onClick={() => setRenamingId(item.id)}><PenLine size={11} /></button>
            <button className="vt-iconbtn sm" title="Delete" onClick={() => onDelete(item.id)}><Trash2 size={11} /></button>
          </span>
        )}
      </div>
      {isFolder && open && kids.map((c) => (
        <TreeNode key={c.id} item={c} depth={depth + 1} childrenOf={childrenOf}
          expanded={expanded} toggle={toggle} selectedId={selectedId} onSelect={onSelect}
          matches={matches} q={q}
          renamingId={renamingId} setRenamingId={setRenamingId} onRename={onRename}
          onDelete={onDelete} onCreateFile={onCreateFile} onCreateFolder={onCreateFolder}
          dragId={dragId} setDragId={setDragId} dropTarget={dropTarget} setDropTarget={setDropTarget} doDrop={doDrop} />
      ))}
    </div>
  );
}

/* ------------------------------ editor pane ------------------------------ */
function EditorPane({ file, vault, onEdit, onSelect, onWikiLink, onRename }) {
  // New/empty markdown notes open ready to type; everything else opens in Read.
  const [mode, setMode] = useState(() =>
    file.type === "file" && file.ext === "md" && !(file.content || "").trim() ? "edit" : "read");

  const path = useMemo(() => {
    const parts = []; let cur = file;
    while (cur) { parts.unshift(cur); cur = vault.find((i) => i.id === cur.parentId); }
    return parts;
  }, [file, vault]);

  if (file.type !== "file" || file.ext !== "md") return <NonMarkdown file={file} path={path} />;

  const fm = parseFrontmatter(file.content || "");
  const tags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];

  // backlinks: md notes that [[link]] to this note's base name
  const myName = baseName(file.name).toLowerCase();
  const backlinks = vault.filter((i) => i.type === "file" && i.ext === "md" && i.id !== file.id
    && outboundLinks(i.content || "").some((l) => l.toLowerCase() === myName));

  const goWiki = (target) => {
    const t = target.toLowerCase();
    const hit = vault.find((i) => i.type === "file" && i.ext === "md" && baseName(i.name).toLowerCase() === t);
    if (hit) onSelect(hit.id); else onWikiLink && onWikiLink(target);
  };

  return (
    <div className="vt-editor">
      <div className="vt-edhead">
        <div className="vt-crumbs">
          {path.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 && <span className="vt-crumb-sep">/</span>}
              <span className={"vt-crumb" + (i === path.length - 1 ? " cur" : "")}>{i === path.length - 1 ? baseName(p.name) : p.name}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="vt-modes">
          <button className={mode === "read" ? "on" : ""} onClick={() => setMode("read")}><Eye size={13} /> Read</button>
          <button className={mode === "edit" ? "on" : ""} onClick={() => setMode("edit")}><Code2 size={13} /> Edit</button>
        </div>
      </div>

      <div className="vt-edbody">
        {mode === "edit" ? (
          <div className="vt-cm">
            <CodeMirror value={file.content || ""} height="100%" theme="none"
              basicSetup={CM_SETUP} extensions={CM_EXTENSIONS}
              onChange={(val) => onEdit(file.id, val)} />
          </div>
        ) : (
          <div className="vt-read">
            <h1 className="vt-doc-title">{baseName(file.name)}</h1>
            {(tags.length > 0 || fm.status || fm.owner) && (
              <div className="vt-fm">
                {fm.status && <span className="vt-fm-pill" data-k="status">{fm.status}</span>}
                {fm.owner && <span className="vt-fm-pill" data-k="owner">@ {fm.owner}</span>}
                {tags.map((t) => <span key={t} className="vt-tag">#{t}</span>)}
              </div>
            )}
            <div className="md-doc">{renderMarkdown(file.content || "", goWiki)}</div>

            <div className="vt-backlinks">
              <div className="vt-bl-h"><Link2 size={13} /> {backlinks.length} backlink{backlinks.length === 1 ? "" : "s"}</div>
              {backlinks.map((b) => (
                <button key={b.id} className="vt-bl" onClick={() => onSelect(b.id)}>
                  <FileText size={13} /> {baseName(b.name)}
                </button>
              ))}
              {backlinks.length === 0 && <div className="vt-bl-empty">No notes link here yet.</div>}
            </div>
          </div>
        )}
      </div>
      <div className="vt-edfoot">
        <span>{(file.content || "").split(/\s+/).filter(Boolean).length} words · updated {file.updated || "now"}</span>
        <span className="vt-indexed"><Database size={11} /> indexed for RAG</span>
      </div>
    </div>
  );
}

function NonMarkdown({ file, path }) {
  const kind = FILE_KIND[file.ext] || { label: file.ext?.toUpperCase() || "File", color: "var(--ink-3)" };
  const Ic = fileIcon(file.ext);
  return (
    <div className="vt-editor">
      <div className="vt-edhead">
        <div className="vt-crumbs">
          {path.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 && <span className="vt-crumb-sep">/</span>}
              <span className={"vt-crumb" + (i === path.length - 1 ? " cur" : "")}>{p.name}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="vt-edbody" style={{ display: "grid", placeItems: "center" }}>
        <div className="vt-binary">
          <span className="vt-binary-ic" style={{ color: kind.color }}><Ic size={34} /></span>
          <div className="vt-binary-name">{file.name}</div>
          <div className="vt-binary-meta">{kind.label} · {file.size || "—"}</div>
          <p className="vt-binary-note">No inline preview for {kind.label.toLowerCase()} files — but Steward still extracts and indexes its text, so Studio can retrieve from it.</p>
          <span className="vt-indexed"><Database size={11} /> indexed for RAG</span>
        </div>
      </div>
    </div>
  );
}
