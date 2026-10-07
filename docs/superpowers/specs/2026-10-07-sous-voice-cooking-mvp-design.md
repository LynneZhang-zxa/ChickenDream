# Sous: hands-free voice cooking assistant MVP (hackathon design)

Date: 2026-10-07. Deadline: about two hours from design approval. Team: Eric + Claude.

## Goal

A React + TypeScript cooking app controlled by voice, powered by the ALEBEX voice agent
platform. One hardcoded recipe (Creamy Garlic Chicken, 2 servings). The complete loop
must work end to end: cook speaks → ALEBEX agent understands → agent calls a tool that
updates recipe state → UI updates → agent answers aloud.

Out of scope today (future, keep the data model open for it): user-uploaded recipes
(photo, video, text), ingredient-photo suggestions, recipe dataset, calorie tracking,
real wake word. The home page shows these as non-functional cards.

## Key constraints from the ALEBEX contract (AGENTS.md) and the hosting choice

- Custom tools are HTTPS webhooks the engine POSTs to a **public** host. On Vercel that
  is simply an API route on the deployment URL. For local development the dev server is
  exposed with ngrok and `PUBLIC_BASE` points at it.
- Vercel cannot terminate a long-lived WebSocket, so the browser opens the ALEBEX call
  socket directly. The API key never reaches the page: an API route exchanges it for a
  short-lived token (`POST https://api.voice.alebex.ai/public/token`, header `X-API-Key`)
  and the browser connects with subprotocol `alebex.token.<short-lived token>`.
- Mic audio: PCM16, 16 kHz, mono, 20 ms binary frames (640 bytes). Agent audio: base64
  PCM16 at 24 kHz. `mark` frames are echoed only after the audio before them has played.
  `clear_audio` means the cook interrupted: stop all scheduled playback, then echo marks.
- Limits: 8 tools per call, 20 tool runs per call, context 4,000 chars, knowledge base
  chunked into ~800-char passages retrieved per turn.
- Live call events (`call_event` on the socket) let the browser make the agent speak when
  a timer fires. Requires `behaviour.callEvents: true` on the agent.
- Serverless functions hold no memory between calls, so session state lives in Supabase
  Postgres, and Supabase Realtime pushes row changes to the browser.

## Architecture

```
Browser (Next.js client)             Vercel API routes (Next.js)                 ALEBEX / Supabase
 Home page (scrolls)                  POST /api/call/start → creates session row,   Voice Engine:
 Cook screen                            mints short-lived WS token, returns the      POST /public/token
  WS directly to ALEBEX ◄──────────────  full start_call frame (agent, tools,         wss://.../public/ws/call
  mic 16k PCM16, plays 24k audio        context, knowledgeBase) for the browser
  sends call_event when a timer fires POST /api/tools → verifies session secret,      Alebex API: agents
  Supabase Realtime subscription ◄──    applies transition, writes session row ──►  Supabase Postgres
  on cooking_sessions row                                                             (Realtime on the row)
```

One `cooking_sessions` row per cooking session. `recipes` table seeded from the hardcoded
recipe. No auth. Supabase anon key in the browser (read-only policies); service role key
in API routes only.

### Supabase schema

- `recipes` (id text pk, title, description, data jsonb, created_at). `data` is the full
  `Recipe` JSON.
- `cooking_sessions` (id uuid pk, recipe_id, secret text, step_index int, servings int,
  substitutions jsonb, timers jsonb, voice_command text null, status text, call_id text
  null, updated_at). Realtime enabled. Anon may select; writes only through service role.

### Modules

- `lib/recipe.ts`: `Recipe`, `Step`, `Ingredient` types and the hardcoded recipe (also the
  seed). This type is the contract a future user-uploaded recipe must satisfy.
- `lib/session.ts`: pure transitions on a `SessionState`: `nextStep`, `previousStep`,
  `jumpToStep`, `setServings` (scales amounts), `noteSubstitution`, `startTimer`,
  `cancelTimer`. Each returns the new state plus a `spoken` line. Unit tested with Vitest.
- `lib/agent-config.ts`: agent prompt, first message, the 8 tool definitions (URL built
  from `PUBLIC_BASE` or the request host), `buildContext(recipe, state)` (≤ 4,000 chars),
  `knowledgeBase` text.
- `lib/supabase.ts`: server client (service role) and browser client (anon).
- `app/api/call/start/route.ts`: creates the session, mints the token, returns
  `{ sessionId, token, wsUrl, startCall }`.
- `app/api/tools/route.ts`: tool webhook. Checks `X-Sous-Session` and `X-Sous-Secret`,
  dispatches on `body.tool`, updates the row, returns speakable JSON.
- `app/api/session/[id]/route.ts`: GET current state (fallback if Realtime lags).
- `scripts/create-agent.ts`: creates or updates the "Sous" agent, writes `ALEBEX_AGENT_ID`
  into `.env.local`. `scripts/seed.ts`: upserts recipes.
- `components/voice/useVoiceCall.ts`: mic capture (AudioWorklet at 16 kHz), playback
  (AudioContext at 24 kHz, mark rule, clear_audio), socket lifecycle, voice state machine,
  timer firing → `call_event`.
- `app/page.tsx` (Home), `app/cook/[sessionId]/page.tsx` (Cook), components under
  `components/`.

### Timers

A serverless function cannot wait, so a timer is a row in `timers` with `endsAt`. The
browser counts down and, when one ends, sends `call_event` `timer.done` (priority
`interrupt`, idempotencyKey = timer id) on its own socket, plays a chime, and marks the
timer fired through `POST /api/tools` with tool `manage_timer`, action `fired`.

### Tools (exactly 8)

| Tool | Fires when the cook says | Does not fire when | Returns |
|---|---|---|---|
| `next_step` | done, next, finished, move on, ready | asks a question about the step | new step number, instruction, `spoken` |
| `previous_step` | go back, previous step | | same shape |
| `get_current_step` | repeat the step, where am I, what do I do now | asks to repeat an answer you just gave | current step, its ingredients |
| `jump_to_step` {step_number} | go to step N, start over | | same shape |
| `manage_timer` {action start/cancel, label, seconds} | set/cancel a timer | the recipe mentions a time but the cook didn't ask | `spoken` confirmation |
| `note_substitution` {ingredient, substitute} | lacks an ingredient and a swap is agreed | | `spoken` confirmation |
| `set_servings` {servings} | changes how many people | | scaled key quantities, `spoken` |
| `go_to_sleep` | that's all, go to sleep, stop listening, thanks Sous | | `spoken` sign-off; server sends `command: sleep` |

Every tool response carries a `spoken` field written for the voice (no digits, no
symbols). The prompt tells the agent to read it.

### Agent prompt (summary; full text in `server/agent-config.ts`)

Follows the ALEBEX prompt skeleton. Priority order: safety (smoke, fire, burns, allergies,
food safety) → tone floor (never shame the cook) → truth → the cook's question → the goal
(finish the recipe) → brevity. Rules from the brief: one action at a time, under two
sentences, one clarification question at a time, stop when interrupted, questions never
advance the recipe, distinguish known facts from uncertainty, remember step, timers,
substitutions and servings. Tool policy per the table. Live event `timer.done` described.
Speaking format: no exclamation marks, numbers in words, contractions.

- `context` (per call): recipe title, servings, current step, full ingredient list and
  numbered steps. Fits in 4,000 chars.
- `knowledgeBase` (per call): troubleshooting (burning garlic, splitting sauce, raw
  chicken, too salty, smoke and fire) and a substitution table (heavy cream and others).
- First message (recipe-agnostic): the agent introduces itself, says the recipe is loaded,
  and invites the cook to say "what's next" or ask anything.

### Voice state machine (client)

`idle` → (Start cooking) → `connecting` → `listening` ⇄ `sleeping`, with `speaking`
overlaid while agent audio plays.

- One continuous ALEBEX call per cooking session. "Sleeping" means the mic is muted:
  the client keeps sending 20 ms frames of silence so the engine stays happy.
- Big mic button toggles `sleeping` ↔ `listening`. The `go_to_sleep` tool also sleeps it.
- `speaking` while any scheduled buffer is playing; back to the previous state after the
  last mark is echoed. The cook can barge in; the engine sends `clear_audio`.
- Auto-sleep after 15 s with no cook transcript and no agent audio (constant `AUTO_SLEEP_MS`).
- End cooking closes the socket (`end_call`).

### UI

Two routes. Tailwind v4 plus a little custom CSS, Google Fonts (a serif display
face for headlines, a sans for body). Palette from the mockup: deep green, cream, soft
yellow, coral accent. Food images are gradient tiles with emoji, so nothing external can
break during the demo.

1. **Home** (scrolls): top nav (Sous logo, Home, Recipes, Nutrition, My Recipes, icons),
   hero ("Good Food Starts with a Conversation", search bar), four feature cards (What Can
   I Cook?, Upload a Recipe, Today's Recommendation, Start Cooking with Voice with the big
   green mic), Popular Recipes row with category chips, bottom grid (Nutrition Dashboard,
   My Recipes, Quick Actions). Only "Start Cooking with Voice" and the Creamy Garlic
   Chicken card are live; other actions show a "Coming soon" toast.
2. **Cook**: header with back, recipe title, servings, step count. Main column: current
   step card (step n of N, title, instruction, this step's ingredients, safety note),
   progress bar and step rail (done / current / upcoming), timers with live countdowns,
   substitutions. Side column: voice panel with the mic button, state ring (grey sleeping,
   green pulse listening, amber waves speaking), status label, latest exchange (last cook
   line, last agent line) and a short transcript. It must read as a cooking app, not a chat.

### Error handling

- Missing env: API routes return a 500 with a readable message naming the variable.
- Token exchange fails: `/api/call/start` returns the ALEBEX error; the UI shows it.
- Upstream `error` frames: shown in the voice panel with the code; socket-closing codes
  return the client to `idle`.
- Tool endpoint: unknown tool or bad secret → 4xx with a readable `error` string.
- Tool-run limit (20 per call): logged; if hit, the UI shows a hint to restart the session.

### Testing

- Vitest on `lib/session.ts` and `buildContext` length.
- `scripts/smoke-tools.sh`: curl the tool endpoint locally to verify dispatch and the
  Supabase write without the engine.
- Manual end-to-end with a real call in Chrome, headphones on.

### Build order

1. Scaffold Next.js + Tailwind; Supabase project, schema, seed.
2. Recipe data + session logic + tests.
3. API routes: call start (token), tools webhook, session read.
4. Agent creation script with the prompt.
5. Client voice hook (audio in/out, mark rule, state machine, timers → events).
6. Cook screen with Realtime subscription.
7. Home page.
8. Deploy to Vercel, env vars, live test, prompt tuning.
