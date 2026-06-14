/* ============================================================================
   Steward — the agent loop. Provider-neutral: the loop keeps a neutral
   transcript and delegates each streamed model turn to a provider (Claude or
   OpenAI) in providers.js. Read tools execute immediately and stream in as
   reasoning nodes; write tools (send / create) PAUSE for explicit user
   approval — the same "nothing is sent or filed without your approval" contract,
   enforced on real tool calls, for whichever model is driving.

   Protocol (client <-> /api/chat), newline-delimited JSON:
     C->S  POST { transcript:[...neutral...], provider?, resolve?:{id,decision,note?,input?} }
     S->C  {type:"text_delta", text}
           {type:"assistant_message", text, toolCalls:[{id,name,input}]}
           {type:"tool_result", id, name, result, node}
           {type:"approval_request", id, name, input, node}   // stream stops here
           {type:"done"} | {type:"error", message} | {type:"no_key", provider, label}
   ========================================================================== */

import {
  readSource, findRelated, findParts, awaitReply, draftAndSend, createArtifact,
} from "./world.js";
import { turnForKind, summarizeProviderError } from "./providers.js";

/* ------------------------------- tool layer ------------------------------- */

const TOOLS = [
  { name: "read_source", kind: "observe", write: false, conf: 92,
    description: "Read one connected source for signal on a topic. Use this first to ground a Move in real data instead of guessing.",
    input_schema: { type: "object", properties: {
      source: { type: "string", enum: ["granola", "slack", "jira", "outlook"], description: "Which source to read." },
      query: { type: "string", description: "What you're looking for." } }, required: ["source", "query"] } },

  { name: "find_related", kind: "connect", write: false, conf: 85,
    description: "Find an existing open thread, ticket, or decision related to a topic, so a Move connects to prior context rather than duplicating it.",
    input_schema: { type: "object", properties: {
      topic: { type: "string", description: "The topic to find related context for." } }, required: ["topic"] } },

  { name: "find_parts", kind: "retrieve", write: false, conf: 74,
    description: "Find purchasable parts/options that match a spec (mock Amazon search).",
    input_schema: { type: "object", properties: {
      spec: { type: "string", description: "Spec to match, e.g. '2.0 mm thermal pad'." },
      vendor: { type: "string", description: "Optional brand/vendor to filter to." } }, required: ["spec"] } },

  { name: "await_reply", kind: "await", write: false, conf: 90,
    description: "Check for / await the reply to a message you sent. Returns the latest reply if there is one.",
    input_schema: { type: "object", properties: {
      to: { type: "string", description: "Who you're awaiting a reply from." } }, required: ["to"] } },

  { name: "draft_and_send", kind: "send", write: true, conf: 80,
    description: "Draft and send a message to a person or channel. WRITE ACTION — proposes the draft and waits for the user's approval before anything is sent.",
    input_schema: { type: "object", properties: {
      to: { type: "string", description: "Recipient (person or channel)." },
      channel: { type: "string", description: "Channel/medium, e.g. 'Slack DM', 'Outlook'." },
      message: { type: "string", description: "The full message to send." } }, required: ["to", "message"] } },

  { name: "create_artifact", kind: "create", write: true, conf: 88,
    description: "Create the terminal artifact of a Move — a Jira ticket, Confluence page, calendar invite, etc. WRITE ACTION — proposes it and waits for the user's approval before filing.",
    input_schema: { type: "object", properties: {
      system: { type: "string", description: "Target system, e.g. 'Jira', 'Confluence', 'Calendar'." },
      type: { type: "string", description: "Artifact type, e.g. 'Task', 'Page', 'Invite'." },
      summary: { type: "string", description: "One-line summary of the artifact." },
      fields: { type: "object", description: "Optional extra fields (e.g. {links})." } }, required: ["system", "type", "summary"] } },
];

const BY_NAME = Object.fromEntries(TOOLS.map((t) => [t.name, t]));
const isWrite = (name) => !!(BY_NAME[name] && BY_NAME[name].write);

function executeTool(name, input) {
  switch (name) {
    case "read_source": return readSource(input);
    case "find_related": return findRelated(input);
    case "find_parts": return findParts(input);
    case "await_reply": return awaitReply(input);
    case "draft_and_send": return draftAndSend(input);
    case "create_artifact": return createArtifact(input);
    default: return { error: `Unknown tool ${name}` };
  }
}

/* Map a tool call (and optional result) to a Steward spine node for the UI. */
function nodeFor(name, input = {}, result) {
  const t = BY_NAME[name] || {};
  const base = { type: t.kind || "observe", conf: t.conf };
  switch (name) {
    case "read_source":
      return { ...base, title: `Read ${input.source || "source"}`,
        body: result ? (result.text || result.note) : `Reading ${input.source || "source"} for “${input.query || ""}”…`,
        srcs: result && result.ref ? [result.ref] : [] };
    case "find_related":
      return { ...base, title: "Linked a related thread",
        body: result ? (result.related || result.note) : `Looking for context related to “${input.topic || ""}”…`,
        srcs: result && result.ref ? [result.ref] : [] };
    case "find_parts":
      return { ...base, title: "Found matching options",
        body: result ? undefined : `Searching options for ${input.spec || ""}…`,
        parts: result ? result.parts : undefined, srcs: ["Amazon"] };
    case "await_reply":
      return { ...base, title: `Awaiting reply from ${input.to || "them"}`,
        reply: result ? `${result.from}: ${result.text}` : undefined,
        body: result ? undefined : "Waiting on their reply…" };
    case "draft_and_send":
      return { ...base, title: "Draft a message — send for your approval",
        to: input.to || input.channel || "recipient", message: input.message };
    case "create_artifact":
      return { ...base, title: "File the artifact — execute on your approval",
        ticket: { project: input.system || "Jira", type: input.type || "Task",
          summary: input.summary || "", assignee: "You",
          links: (input.fields && input.fields.links) || "this conversation" } };
    default:
      return base;
  }
}

const SYSTEM = `You are Steward, an executive chief-of-staff agent. You work problems WITH the user in real time, then crystallize the work into a "Move": the smallest reasoned action chain that moves a needle, ending in a concrete artifact.

How you work:
- Ground everything in the user's actual data. Reach for read_source / find_related / find_parts BEFORE proposing anything. Never invent facts you could look up.
- Call exactly ONE tool per turn, then wait for its result. Narrate briefly (one or two sentences) around each step — you are thinking out loud with the user, not writing an essay.
- draft_and_send and create_artifact are WRITE actions. Propose them; the user approves before anything is sent or filed. Never assume approval.
- Aim to reach a terminal artifact (a ticket, page, invite, sent message). When the work is essentially done, say so in one line and suggest saving it as a Move.
- If the user's goal is ambiguous or you lack signal, say what's missing instead of fabricating a plan.

Tone: concise, candid, grounded. You are a sharp chief of staff, not a chatbot. All connected data is sample/demo data.`;

/* -------------------------------- the loop -------------------------------- */

function makeHandler(opts = {}) {
  // Config is resolved per-request via getConfig() so Settings changes apply
  // without a server restart. (Back-compat: also accepts a fixed providers map.)
  const getConfig = typeof opts.getConfig === "function"
    ? opts.getConfig
    : () => ({ providers: opts.providers || {}, defaultProvider: opts.defaultProvider || "anthropic" });

  return async function handleChat(req, res) {
    const emit = (evt) => res.write(JSON.stringify(evt) + "\n");
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");

    let body;
    try { body = await readJson(req); }
    catch { emit({ type: "error", message: "Bad request body." }); return res.end(); }

    const { providers = {}, defaultProvider = "anthropic" } = getConfig() || {};
    const providerName = (body.provider && providers[body.provider]) ? body.provider : defaultProvider;
    let pconf = providers[providerName] || {};
    // OAuth providers refresh their access token here, just-in-time.
    if (opts.prepareProvider) {
      try { pconf = (await opts.prepareProvider(pconf)) || pconf; }
      catch (e) { emit({ type: "error", message: summarizeProviderError(e) }); return res.end(); }
    }
    if (!pconf.apiKey) { emit({ type: "no_key", provider: providerName, label: pconf.label || providerName }); return res.end(); }

    const neutral = Array.isArray(body.transcript) ? body.transcript.slice() : [];
    const resolve = body.resolve || null;

    if (resolve) {
      const lastAssistant = [...neutral].reverse().find((i) => i.role === "assistant");
      const turnCalls = (lastAssistant && lastAssistant.toolCalls) || [];
      for (const tc of turnCalls) {
        if (tc.id === resolve.id) {
          if (resolve.decision === "approve") {
            const input = resolve.input || tc.input;
            const out = executeTool(tc.name, input);
            emit({ type: "tool_result", id: tc.id, name: tc.name, result: out, node: nodeFor(tc.name, input, out), approved: true });
            neutral.push({ role: "tool", id: tc.id, name: tc.name, result: out });
          } else {
            const out = { declined: true, reason: resolve.note || "The user declined this action." };
            emit({ type: "tool_result", id: tc.id, name: tc.name, result: out, declined: true, note: resolve.note || null });
            neutral.push({ role: "tool", id: tc.id, name: tc.name, result: out });
          }
        } else {
          neutral.push({ role: "tool", id: tc.id, name: tc.name, result: { deferred: true, note: "Steward runs one action at a time; reissue if still needed." } });
        }
      }
    }

    try {
      await runLoop({ turn: turnForKind(pconf.kind), pconf, neutral, emit });
    } catch (e) {
      emit({ type: "error", message: summarizeProviderError(e) });
    }
    res.end();
  };
}

async function runLoop({ turn, pconf, neutral, emit }) {
  const model = pconf.model || (pconf.kind === "anthropic" ? "claude-sonnet-4-6" : "gpt-4o");
  for (let hop = 0; hop < 12; hop++) {
    let out;
    try {
      out = await turn({ apiKey: pconf.apiKey, baseURL: pconf.baseURL, headers: pconf.headers, model, system: SYSTEM, tools: TOOLS, neutral, onText: (t) => emit({ type: "text_delta", text: t }) });
    } catch (e) {
      emit({ type: "error", message: summarizeProviderError(e) });
      return;
    }
    const { text, toolCalls } = out;
    emit({ type: "assistant_message", text, toolCalls });
    neutral.push({ role: "assistant", text, toolCalls });

    if (!toolCalls.length) { emit({ type: "done" }); return; }

    const primary = toolCalls[0];
    if (isWrite(primary.name)) {
      emit({ type: "approval_request", id: primary.id, name: primary.name, input: primary.input, node: nodeFor(primary.name, primary.input) });
      return; // gate — resumes on the next request with a `resolve`
    }

    toolCalls.forEach((t, idx) => {
      if (idx === 0) {
        const out = executeTool(t.name, t.input);
        emit({ type: "tool_result", id: t.id, name: t.name, result: out, node: nodeFor(t.name, t.input, out) });
        neutral.push({ role: "tool", id: t.id, name: t.name, result: out });
      } else {
        neutral.push({ role: "tool", id: t.id, name: t.name, result: { deferred: true, note: "One action per turn; reissue next turn." } });
      }
    });
  }
  emit({ type: "error", message: "Reached the step limit for one turn." });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 8e6) req.destroy(); });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

/* Browser-safe view of configured providers (no secrets). */
function publicProviders(providers = {}, defaultProvider = "anthropic") {
  return Object.entries(providers).map(([id, p]) => ({
    id, label: p.label || id, kind: p.kind || "chat", builtin: !!p.builtin,
    hasKey: !!p.apiKey, baseURL: p.baseURL || null, model: p.model || null,
    isDefault: id === defaultProvider,
  }));
}

export { makeHandler, TOOLS, nodeFor, runLoop, executeTool, isWrite, publicProviders };
