import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { makeHandler, publicProviders } from "./server/agent.js";
import { resolveProviders, applySettingsAction } from "./server/config.js";
import { startSignIn, ensureFreshToken, oauthTransport, listWhamModels } from "./server/openai-oauth.js";

/* Steward's real-model backend runs as Vite dev/preview middleware so the whole
   demo is still one `npm run dev`. Keys live server-side (in .env.local or the
   Settings-managed steward.config.local.json) and are never shipped to the
   browser. Provider config is resolved per request, so Settings changes apply
   without a restart. */
export default defineConfig(({ mode }) => {
  const root = process.cwd();
  const env = loadEnv(mode, root, "");
  const getConfig = () => resolveProviders(root, env);

  const readBody = (req) => new Promise((resolve, reject) => {
    let d = ""; req.on("data", (c) => { d += c; if (d.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
  const json = (res, code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
  const settingsView = () => { const { providers, defaultProvider } = getConfig(); return { providers: publicProviders(providers, defaultProvider), defaultProvider }; };

  const prepareProvider = async (pconf) => {
    if (pconf && pconf.kind === "openai-oauth") {
      const oauth = await ensureFreshToken(root);
      if (oauth) return { ...pconf, ...oauthTransport(oauth) };
    }
    return pconf;
  };

  const mount = (server) => {
    const chat = makeHandler({ getConfig, prepareProvider });

    server.middlewares.use("/api/chat", (req, res, next) => {
      if (req.method !== "POST") return next();
      chat(req, res).catch((e) => { res.statusCode = 500; res.end(String(e)); });
    });

    server.middlewares.use("/api/providers", (req, res, next) => {
      if (req.method !== "GET") return next();
      json(res, 200, settingsView().providers);
    });

    server.middlewares.use("/api/settings", async (req, res, next) => {
      if (req.method === "GET") return json(res, 200, settingsView());
      if (req.method === "POST") {
        try { applySettingsAction(root, await readBody(req)); json(res, 200, settingsView()); }
        catch (e) { json(res, 400, { error: String(e.message || e) }); }
        return;
      }
      next();
    });

    // Start "Sign in with ChatGPT": opens the local :1455 callback listener and
    // returns the authorize URL for the browser to open.
    server.middlewares.use("/api/auth/openai/start", async (req, res, next) => {
      if (req.method !== "POST") return next();
      try { const { authorizeUrl } = await startSignIn(root); json(res, 200, { authorizeUrl }); }
      catch (e) { json(res, 400, { error: String(e.message || e) }); }
    });

    // List available model slugs for a (ChatGPT-OAuth/WHAM) provider.
    server.middlewares.use("/api/providers/models", async (req, res, next) => {
      if (req.method !== "POST") return next();
      try {
        const { id } = await readBody(req);
        const { providers } = getConfig();
        let pconf = providers[id];
        if (!pconf) return json(res, 404, { error: "Unknown provider" });
        pconf = (await prepareProvider(pconf)) || pconf;
        json(res, 200, { models: await listWhamModels(pconf) });
      } catch (e) { json(res, 400, { error: String(e.message || e) }); }
    });
  };

  return {
    plugins: [react(), { name: "steward-api", configureServer: mount, configurePreviewServer: mount }],
    // The native shell hosts this in a WKWebView, so don't pop a stray browser
    // tab on `make web-dev`. `strictPort` keeps DEBUG's hardcoded :5173 honest.
    server: { open: false, port: 5173, strictPort: true },
  };
});
