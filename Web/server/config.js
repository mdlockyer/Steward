/* ============================================================================
   Settings persistence. The browser can't write env files or spawn processes,
   so the Settings panel posts changes to the server, which persists them to a
   gitignored JSON file. Provider config = built-ins (keys from .env) overlaid
   with whatever Settings has saved (key overrides + custom chat providers +
   default). Resolved per request so changes apply without a restart.
   ========================================================================== */

import fs from "node:fs";
import path from "node:path";

const FILE = "steward.config.local.json";
const configPath = (root) => path.join(root, FILE);

export function loadFileConfig(root) {
  try { return JSON.parse(fs.readFileSync(configPath(root), "utf8")); }
  catch { return {}; }
}
export function saveFileConfig(root, cfg) {
  fs.writeFileSync(configPath(root), JSON.stringify(cfg, null, 2));
  return cfg;
}

export function builtinProviders(env = {}) {
  return {
    anthropic: { kind: "anthropic", label: "Claude", builtin: true,
      apiKey: env.ANTHROPIC_API_KEY || "", model: env.STEWARD_MODEL || "claude-sonnet-4-6" },
    openai: { kind: "chat", label: "OpenAI", builtin: true,
      apiKey: env.OPENAI_API_KEY || "", model: env.OPENAI_MODEL || "gpt-4o" },
  };
}

/* Built-ins (env) overlaid with the saved file config. */
export function resolveProviders(root, env = {}) {
  const providers = builtinProviders(env);
  const file = loadFileConfig(root);
  for (const [id, p] of Object.entries(file.providers || {})) {
    const prev = providers[id] || {};
    providers[id] = { ...prev, ...p, kind: p.kind || prev.kind || "chat", builtin: !!prev.builtin };
    if (!providers[id].apiKey && p.apiKeyEnv) {
      providers[id].apiKey = env[p.apiKeyEnv] || process.env[p.apiKeyEnv] || "";
    }
  }
  // ChatGPT-OAuth providers carry their access token in .oauth — map it to the
  // transport fields a turn needs (token-as-key, WHAM base, account header).
  for (const p of Object.values(providers)) {
    if (p.kind === "openai-oauth" && p.oauth && p.oauth.access) {
      p.apiKey = p.oauth.access;
      p.baseURL = "https://chatgpt.com/backend-api/wham";
      p.headers = p.oauth.accountId ? { "ChatGPT-Account-Id": p.oauth.accountId } : undefined;
    }
  }
  const defaultProvider = file.defaultProvider || env.STEWARD_PROVIDER || process.env.STEWARD_PROVIDER || "anthropic";
  return { providers, defaultProvider };
}

/* Discrete, intent-revealing actions so a key is never wiped by accident. */
export function applySettingsAction(root, action = {}) {
  const cfg = loadFileConfig(root);
  cfg.providers = cfg.providers || {};
  const set = (id, patch) => { cfg.providers[id] = { ...(cfg.providers[id] || {}), ...patch }; };

  switch (action.action) {
    case "setKey": set(action.id, { apiKey: action.apiKey || "" }); break;
    case "clearKey": set(action.id, { apiKey: "" }); break;
    case "setModel": set(action.id, { model: action.model || "" }); break;
    case "setDefault": cfg.defaultProvider = action.id; break;
    case "addProvider": {
      const p = action.provider || {};
      if (!p.id || !/^[a-z0-9_-]+$/i.test(p.id)) throw new Error("valid provider id required (a-z, 0-9, -, _)");
      cfg.providers[p.id] = {
        kind: "chat", label: p.label || p.id, baseURL: p.baseURL || "",
        model: p.model || "", apiKey: p.apiKey || "",
        ...(p.headers ? { headers: p.headers } : {}),
      };
      break;
    }
    case "removeProvider":
      delete cfg.providers[action.id];
      if (cfg.defaultProvider === action.id) delete cfg.defaultProvider;
      break;
    default: throw new Error("unknown action: " + action.action);
  }
  return saveFileConfig(root, cfg);
}
