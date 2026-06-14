/* ============================================================================
   "Sign in with ChatGPT" — OAuth against OpenAI's Codex/WHAM backend so a user
   can drive Steward with their ChatGPT Plus/Pro/Team plan instead of an API key.

   ⚠️ REVERSE-ENGINEERED / UNDOCUMENTED. This reuses the Codex CLI's public OAuth
   client and an internal backend (chatgpt.com/backend-api/wham). It is a ToS
   gray area and can break if OpenAI changes anything. Spec sourced from the
   official Codex auth docs + the 7shi/codex-oauth reference implementation.

   Flow: PKCE authorize in the browser → OpenAI redirects to a local callback on
   :1455 → exchange code for tokens → store under the "openai-chatgpt" provider.
   ========================================================================== */

import crypto from "node:crypto";
import http from "node:http";
import { loadFileConfig, saveFileConfig } from "./config.js";

export const OAUTH_PROVIDER_ID = "openai-chatgpt";
export const WHAM_BASE = "https://chatgpt.com/backend-api/wham";

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"; // Codex CLI public client (reused; no third-party allocation exists)
const AUTH_URL = "https://auth.openai.com/oauth/authorize";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const REDIRECT_URI = "http://localhost:1455/auth/callback";
const SCOPE = "openid profile email offline_access";
const ORIGINATOR = "codex"; // reference uses "codex"/"opencode"; switch if sign-in is rejected
const CALLBACK_PORT = 1455;

const b64url = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function pkce() {
  const verifier = b64url(crypto.randomBytes(64));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function buildAuthorizeUrl({ challenge, state }) {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    code_challenge: challenge,
    code_challenge_method: "S256",
    id_token_add_organizations: "true",
    codex_cli_simplified_flow: "true",
    originator: ORIGINATOR,
    state,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

async function postForm(url, params) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

export function exchangeCode({ code, verifier }) {
  return postForm(TOKEN_URL, {
    grant_type: "authorization_code", client_id: CLIENT_ID, code,
    redirect_uri: REDIRECT_URI, code_verifier: verifier,
  });
}

export function refreshTokens(refresh) {
  return postForm(TOKEN_URL, {
    grant_type: "refresh_token", client_id: CLIENT_ID, refresh_token: refresh, scope: SCOPE,
  });
}

function decodeJwt(t) {
  try { return JSON.parse(Buffer.from(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")); }
  catch { return null; }
}

export function accountIdFromTokens(tokens = {}) {
  for (const t of [tokens.id_token, tokens.access_token]) {
    const p = t && decodeJwt(t);
    if (!p) continue;
    if (p.chatgpt_account_id) return p.chatgpt_account_id;
    const a = p["https://api.openai.com/auth"];
    if (a && a.chatgpt_account_id) return a.chatgpt_account_id;
    if (Array.isArray(p.organizations) && p.organizations[0] && p.organizations[0].id) return p.organizations[0].id;
  }
  return null;
}

function persistTokens(root, tokens, accountId) {
  const cfg = loadFileConfig(root);
  cfg.providers = cfg.providers || {};
  const prev = cfg.providers[OAUTH_PROVIDER_ID] || {};
  cfg.providers[OAUTH_PROVIDER_ID] = {
    kind: "openai-oauth", label: "ChatGPT (OAuth)",
    model: prev.model || "gpt-5.1-codex-mini", // WHAM model "slug"; use "Load models" in Settings to pick
    oauth: {
      access: tokens.access_token,
      refresh: tokens.refresh_token || (prev.oauth && prev.oauth.refresh),
      expires: Date.now() + (tokens.expires_in || 3600) * 1000,
      accountId,
    },
  };
  saveFileConfig(root, cfg);
}

/* Refresh the stored token if it's within 60s of expiry. Returns the live
   oauth object (or null if not signed in). */
export async function ensureFreshToken(root) {
  const cfg = loadFileConfig(root);
  const p = cfg.providers && cfg.providers[OAUTH_PROVIDER_ID];
  if (!p || !p.oauth || !p.oauth.access) return null;
  if (p.oauth.expires - Date.now() > 60000) return p.oauth;
  if (!p.oauth.refresh) return p.oauth;
  const t = await refreshTokens(p.oauth.refresh);
  p.oauth = {
    access: t.access_token,
    refresh: t.refresh_token || p.oauth.refresh,
    expires: Date.now() + (t.expires_in || 3600) * 1000,
    accountId: p.oauth.accountId || accountIdFromTokens(t),
  };
  saveFileConfig(root, cfg);
  return p.oauth;
}

let active = null; // { server, state }

/* Start the browser flow: spin up the :1455 callback listener and return the
   authorize URL for the client to open. Resolves the sign-in when OpenAI
   redirects back. */
export function startSignIn(root) {
  return new Promise((resolve, reject) => {
    const { verifier, challenge } = pkce();
    const state = b64url(crypto.randomBytes(16));
    const authorizeUrl = buildAuthorizeUrl({ challenge, state });

    if (active && active.server) { try { active.server.close(); } catch { /* ignore */ } }

    const page = (msg) => `<!doctype html><meta charset="utf-8"><body style="font:16px -apple-system,system-ui;display:grid;place-items:center;height:100vh;margin:0;color:#1d1d1f"><div style="text-align:center"><h2>${msg}</h2><p style="color:#6e6e73">You can close this tab and return to Steward.</p></div></body>`;

    const server = http.createServer(async (req, res) => {
      const u = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
      if (u.pathname !== "/auth/callback") { res.statusCode = 404; return res.end("not found"); }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      const code = u.searchParams.get("code");
      const st = u.searchParams.get("state");
      const close = () => { try { server.close(); } catch { /* ignore */ } active = null; };
      if (!code || st !== state) { res.statusCode = 400; res.end(page("Sign-in failed (state mismatch).")); close(); return; }
      try {
        const tokens = await exchangeCode({ code, verifier });
        persistTokens(root, tokens, accountIdFromTokens(tokens));
        res.end(page("Signed in to ChatGPT ✓")); close();
      } catch (e) {
        res.statusCode = 500; res.end(page("Token exchange failed.")); close();
      }
    });

    server.on("error", (e) => reject(e));
    server.listen(CALLBACK_PORT, "127.0.0.1", () => { active = { server, state }; resolve({ authorizeUrl }); });
  });
}

/* WHAM's /models has a non-standard schema (key "models", id "slug", requires a
   client_version query). Fetch raw and return the available model slugs. */
export async function listWhamModels({ apiKey, headers } = {}) {
  const r = await fetch(`${WHAM_BASE}/models?client_version=0.0.1`, {
    headers: { Authorization: `Bearer ${apiKey}`, "User-Agent": "steward/0.1.0", ...(headers || {}) },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${text.slice(0, 200)}`);
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("models response was not JSON"); }
  return (data.models || data.data || []).map((m) => m.slug || m.id).filter(Boolean);
}

/* Map a stored oauth provider entry to the fields a turn needs. */
export function oauthTransport(oauth) {
  return {
    apiKey: (oauth && oauth.access) || "",
    baseURL: WHAM_BASE,
    headers: oauth && oauth.accountId ? { "ChatGPT-Account-Id": oauth.accountId } : undefined,
  };
}
