/* ============================================================================
   Provider abstraction. The agent loop is provider-neutral: it keeps a neutral
   transcript (the same shape the client sends) and asks a provider to (a) turn
   that transcript into its own message format and (b) run one streamed model
   turn, returning { text, toolCalls }. Claude and OpenAI both implement this.

   Neutral transcript items:
     { role:"user", text }
     { role:"assistant", text, toolCalls:[{id,name,input}] }
     { role:"tool", id, name, result }            // result is a JSON-able object
   ========================================================================== */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/* ------------------------------ tool schemas ------------------------------ */
export const toAnthropicTools = (tools) =>
  tools.map(({ name, description, input_schema }) => ({ name, description, input_schema }));

export const toOpenAITools = (tools) =>
  tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } }));

/* ---------------------------- message bridges ----------------------------- */
export function toAnthropicMessages(neutral = []) {
  const messages = [];
  let pending = [];
  const flush = () => { if (pending.length) { messages.push({ role: "user", content: pending }); pending = []; } };
  for (const it of neutral) {
    if (it.role === "user") {
      flush();
      messages.push({ role: "user", content: contentToAnthropic(it) });
    } else if (it.role === "assistant") {
      flush();
      const content = [];
      if (it.text && it.text.trim()) content.push({ type: "text", text: it.text });
      for (const tc of it.toolCalls || []) content.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.input || {} });
      if (content.length) messages.push({ role: "assistant", content });
    } else if (it.role === "tool") {
      pending.push({ type: "tool_result", tool_use_id: it.id, content: JSON.stringify(it.result) });
    }
  }
  flush();
  return messages;
}

export function toOpenAIMessages(neutral = [], system = "") {
  const msgs = system ? [{ role: "system", content: system }] : [];
  for (const it of neutral) {
    if (it.role === "user") {
      msgs.push({ role: "user", content: contentToOpenAI(it) });
    } else if (it.role === "assistant") {
      const m = { role: "assistant", content: it.text || "" };
      if (it.toolCalls && it.toolCalls.length) {
        m.content = it.text || null;
        m.tool_calls = it.toolCalls.map((tc) => ({
          id: tc.id, type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.input || {}) },
        }));
      }
      msgs.push(m);
    } else if (it.role === "tool") {
      msgs.push({ role: "tool", tool_call_id: it.id, content: JSON.stringify(it.result) });
    }
  }
  return msgs;
}

/* attachments: a user item may carry .attachments [{kind:'image'|'text', ...}].
   Text is inlined; images become provider-native image parts. (Wired in the
   file-upload pass; harmless no-op when absent.) */
function contentToAnthropic(it) {
  const parts = [];
  for (const a of it.attachments || []) {
    if (a.kind === "image") parts.push({ type: "image", source: { type: "base64", media_type: a.mediaType, data: a.data } });
    else if (a.kind === "text") parts.push({ type: "text", text: `Attached file ${a.name}:\n${a.text}` });
  }
  if (it.text) parts.push({ type: "text", text: it.text });
  return parts.length ? parts : [{ type: "text", text: it.text || "" }];
}
function contentToOpenAI(it) {
  if (!it.attachments || !it.attachments.length) return it.text || "";
  const parts = [];
  for (const a of it.attachments || []) {
    if (a.kind === "image") parts.push({ type: "image_url", image_url: { url: `data:${a.mediaType};base64,${a.data}` } });
    else if (a.kind === "text") parts.push({ type: "text", text: `Attached file ${a.name}:\n${a.text}` });
  }
  if (it.text) parts.push({ type: "text", text: it.text });
  return parts;
}

/* ------------------------------- providers -------------------------------- */
async function anthropicTurn({ apiKey, model, system, tools, neutral, onText }) {
  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({
    model, max_tokens: 1500, system,
    tools: toAnthropicTools(tools), messages: toAnthropicMessages(neutral),
  });
  stream.on("text", (t) => onText && onText(t));
  const final = await stream.finalMessage();
  const toolCalls = final.content.filter((b) => b.type === "tool_use").map((b) => ({ id: b.id, name: b.name, input: b.input }));
  const text = final.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  return { text, toolCalls };
}

export function makeChatClient({ apiKey, baseURL, headers } = {}) {
  return new OpenAI({ apiKey: apiKey || "-", baseURL: baseURL || undefined, defaultHeaders: headers || undefined });
}

/* One streamed turn against ANY OpenAI-compatible Chat Completions endpoint.
   `baseURL` selects the provider (OpenAI's default when omitted; otherwise
   OpenRouter, Together, Groq, Fireworks, Ollama / LM Studio / vLLM, etc.).
   The endpoint must support OpenAI-style function/tool calling for Steward's
   loop to drive it. */
async function chatCompletionsTurn({ apiKey, baseURL, headers, model, system, tools, neutral, onText }) {
  const client = makeChatClient({ apiKey, baseURL, headers });
  const stream = await client.chat.completions.create({
    model, max_tokens: 1500, stream: true, tool_choice: "auto",
    tools: toOpenAITools(tools), messages: toOpenAIMessages(neutral, system),
  });
  let text = "";
  const slots = {};
  for await (const chunk of stream) {
    const d = chunk.choices && chunk.choices[0] && chunk.choices[0].delta;
    if (!d) continue;
    if (d.content) { text += d.content; onText && onText(d.content); }
    for (const tc of d.tool_calls || []) {
      const s = slots[tc.index] || (slots[tc.index] = { id: "", name: "", args: "" });
      if (tc.id) s.id = tc.id;
      if (tc.function && tc.function.name) s.name = tc.function.name;
      if (tc.function && tc.function.arguments) s.args += tc.function.arguments;
    }
  }
  const toolCalls = Object.values(slots).map((s) => ({ id: s.id, name: s.name, input: safeParse(s.args) }));
  return { text: text.trim(), toolCalls };
}

function safeParse(s) { try { return s ? JSON.parse(s) : {}; } catch { return {}; } }

/* ---- OpenAI Responses API (used by the ChatGPT-OAuth / WHAM backend) ---- */
export const toResponsesTools = (tools) =>
  tools.map((t) => ({ type: "function", name: t.name, description: t.description, parameters: t.input_schema }));

export function toResponsesInput(neutral = []) {
  const input = [];
  for (const it of neutral) {
    if (it.role === "user") {
      const content = [];
      for (const a of it.attachments || []) {
        if (a.kind === "image") content.push({ type: "input_image", image_url: `data:${a.mediaType};base64,${a.data}` });
        else if (a.kind === "text") content.push({ type: "input_text", text: `Attached file ${a.name}:\n${a.text}` });
      }
      content.push({ type: "input_text", text: it.text || "" });
      input.push({ role: "user", content });
    } else if (it.role === "assistant") {
      if (it.text && it.text.trim()) input.push({ role: "assistant", content: [{ type: "output_text", text: it.text }] });
      for (const tc of it.toolCalls || []) input.push({ type: "function_call", call_id: tc.id, name: tc.name, arguments: JSON.stringify(tc.input || {}) });
    } else if (it.role === "tool") {
      input.push({ type: "function_call_output", call_id: it.id, output: JSON.stringify(it.result) });
    }
  }
  return input;
}

/* WHAM requires: instructions (system) set, store:false, input_text content, and
   the full history each turn. Tool calls come back as Responses function_call items. */
async function openaiResponsesTurn({ apiKey, baseURL, headers, model, system, tools, neutral, onText }) {
  // Request shape matched to the working codex-oauth reference: these are
  // reasoning models, so `reasoning` is required, plus store:false, input_text
  // content, include:[], parallel_tool_calls, and a plain custom User-Agent.
  const client = makeChatClient({
    apiKey, baseURL,
    headers: { ...(headers || {}), "User-Agent": "steward/0.1.0" },
  });
  const stream = await client.responses.create({
    model: model || "gpt-5.1-codex-mini",
    instructions: system, store: false, stream: true,
    reasoning: { effort: "medium", summary: "auto" },
    include: [],
    tools: toResponsesTools(tools), tool_choice: "auto", parallel_tool_calls: true,
    input: toResponsesInput(neutral),
  });
  let text = "";
  const items = {}; // item_id -> { call_id, name, args }
  for await (const event of stream) {
    const t = event.type;
    if (t === "response.output_text.delta") { text += event.delta; onText && onText(event.delta); }
    else if (t === "response.output_item.added" && event.item && event.item.type === "function_call") {
      items[event.item.id] = { call_id: event.item.call_id, name: event.item.name, args: event.item.arguments || "" };
    } else if (t === "response.function_call_arguments.delta") {
      const it = items[event.item_id]; if (it) it.args += event.delta;
    } else if (t === "response.function_call_arguments.done") {
      const it = items[event.item_id]; if (it && typeof event.arguments === "string") it.args = event.arguments;
    }
  }
  const toolCalls = Object.values(items).map((it) => ({ id: it.call_id, name: it.name, input: safeParse(it.args) }));
  return { text: text.trim(), toolCalls };
}

/* The turn implementation is chosen by KIND, so any number of providers can
   share a transport — only baseURL / model / key differ.
   anthropic → Messages API · openai-oauth → Responses/WHAM · else → chat. */
export function turnForKind(kind) {
  if (kind === "anthropic") return anthropicTurn;
  if (kind === "openai-oauth") return openaiResponsesTurn;
  return chatCompletionsTurn;
}

/* Turn a provider/transport error into a short, useful message instead of
   dumping a raw HTML body or a megabyte stack into the chat. */
export function summarizeProviderError(e) {
  if (!e) return "Unknown provider error.";
  const status = e.status || (e.response && e.response.status) || null;
  let detail = "";
  if (e.error) detail = typeof e.error === "string" ? e.error : (e.error.message || safeJson(e.error));
  let msg = (detail || e.message || String(e) || "").trim();
  if (/<!doctype|<html|<head|<body|<title/i.test(msg)) {
    msg = "the endpoint returned an HTML page, not a JSON API response — the base URL is probably not an OpenAI-compatible API";
  }
  msg = msg.replace(/\s+/g, " ").slice(0, 300);
  const rid = e.requestID || e.request_id || (e.headers && e.headers["x-request-id"]) || null;
  // Full detail to the dev terminal — useful when the surfaced message is thin.
  try { console.error("[steward] provider error:", { status, message: e.message, error: e.error, requestID: rid }); } catch { /* ignore */ }
  if (status) return `HTTP ${status} — ${msg}${rid ? ` (request ${rid})` : ""}. Check the base URL/key, or try a different model.`;
  return msg || "Provider request failed.";
}

function safeJson(o) { try { return JSON.stringify(o); } catch { return ""; } }
