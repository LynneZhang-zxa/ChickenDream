# Sous — hands-free AI voice cooking companion

Sous guides you through a recipe by voice while your hands are busy. It is powered by the
[ALEBEX](https://alebex.ai) real-time voice agent platform: ALEBEX handles speech-to-text,
the agent brain, text-to-speech and interruptions; this app owns the recipe state and the UI.

Built at the Alexander hackathon, 2026-10-07.

## How it works

```
Browser (Next.js)                      Next.js API routes                     ALEBEX
 mic → 16 kHz PCM frames  ──────────►  POST /api/call/start                   wss://api.voice.alebex.ai/public/ws/call
 plays 24 kHz agent audio ◄──────────   (session + start_call frame)
 polls /api/session/:id                POST /api/tools  ◄── tool webhooks ──  agent calls next_step, get_current_step,
 sends timer.done events                (updates cooking state)                manage_timer, note_substitution, …
```

The agent gets the full recipe and current step as call context, cooking know-how as a
knowledge base, and eight tools that change the cooking state. Tool calls arrive as HTTPS
webhooks, so locally the dev server is exposed with ngrok.

## Run it locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and set `ALEBEX_API_KEY` (from the ALEBEX console).
3. `npm run create-agent` — creates/updates the "Sous" agent and writes `ALEBEX_AGENT_ID`.
4. In one terminal: `ngrok http 3000` (the server auto-detects the tunnel URL).
5. In another: `npm run dev`, then open http://localhost:3000 in Chrome with headphones.

Say "what's next", "how much garlic", "repeat that", "go back", "set a timer for two minutes",
"I don't have heavy cream", or "we're cooking for four".

## Test without talking

- `npm test` — unit tests for the recipe state machine and agent config limits.
- `npx tsx scripts/e2e-voice.ts` — opens a real call and speaks to the agent with macOS
  text-to-speech, then prints the transcript and resulting state.
- `node scripts/live-ui.mjs <outdir>` — drives the cooking screen in headless Chromium with a
  fake microphone and saves screenshots.

## Deploy

Deploy to Vercel with `ALEBEX_API_KEY` and `ALEBEX_AGENT_ID` set. Tool webhooks use the
deployment's own URL. The ALEBEX short-lived socket token endpoint currently rejects the
account's key, so production also needs `ALLOW_RAW_KEY=1` to open the socket with the API key
itself; only do that for a private demo URL.

