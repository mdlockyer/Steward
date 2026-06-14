# Steward — demo

A Vite + React build of the Steward concept demo: an executive chief-of-staff
agent whose unit of work is a **Move** — the smallest reasoned action chain that
ends in a concrete artifact.

There are four destinations: **Desk** (triage drafted Moves), **Studio** (work a
problem with the AI in real time), **Sources**, and **Log**.

## Run it
```bash
npm install
cp .env.example .env.local   # then paste your Anthropic API key into .env.local
npm run dev
```
Vite prints a local URL (default http://localhost:5173) and opens it automatically.

Studio's agent is **real** — it calls Claude via your key. Without a key the app
still runs: Studio shows a "no model connected" notice and offers a **simulated
walkthrough** of a full Move so the whole UI stays explorable.

## The Studio vein (real AI)
The chat in Studio is a real Anthropic tool-use loop, but the data and side
effects are mock. As the model reasons it calls tools, and **each tool call
renders inline as a Move spine node** — so the conversation literally *is* the
forming Move:

- read tools (`read_source`, `find_related`, `find_parts`, `await_reply`) run
  immediately and stream in as Observe / Connect / Retrieve / Await nodes;
- write tools (`draft_and_send`, `create_artifact`) **pause for your approval** —
  nothing is sent or filed until you click Approve. You can Adjust the draft or
  Reject it, and the model continues from your decision.

When the work is done, **Save as Move** crystallizes the conversation onto the
Desk (its nodes become the Move's spine). From any Desk Move, **Continue in
Studio** drops you back into a chat seeded with that Move's state.

## What's here
- `src/Steward.jsx` — the app shell: Desk, Sources, Log, the Move inspector, and
  the nav. Styles are injected at runtime.
- `src/Studio.jsx` — the chat↔spine timeline, streaming client, approval gates,
  crystallize-to-Move, and the no-key simulated walkthrough.
- `src/main.jsx` — mounts the component.
- `index.html` — host page (centers the app, caps width at 1180px).
- `server/agent.js` — the real Anthropic tool-use loop. Runs as Vite dev/preview
  middleware at `POST /api/chat`, streaming NDJSON events to the browser. Holds
  the API key server-side; gates write tools for approval.
- `server/world.js` — the mock "world" the tools read from and write to.
- `vite.config.js` — wires the React plugin and mounts the agent middleware.

All connected data is mock/sample. Confidence values are placeholder estimates.
The model's *reasoning* is real; the *sources and side effects* are simulated.

## Configuration
- `ANTHROPIC_API_KEY` (required for the real agent) — in `.env.local`.
- `STEWARD_MODEL` (optional) — defaults to `claude-sonnet-4-6`.

## Build for sharing
```bash
npm run build      # outputs static files to dist/
npm run preview    # serves the built dist/ locally (agent middleware included)
```
Requires Node 18+ (built and verified on Node 22).

> Note: a static `dist/` (e.g. opened without the preview server) has no
> `/api/chat` backend, so Studio runs in simulated mode there. The real agent
> needs `npm run dev` or `npm run preview`.

## Known limitation
Navigating away from Studio and back starts a fresh session (the view unmounts).
Crystallizing to a Move first preserves the work. Persisting an in-progress
Studio session across nav is a straightforward follow-up.
