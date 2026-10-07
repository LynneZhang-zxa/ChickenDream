// End-to-end voice test: starts a real ALEBEX call through the app's own API, speaks to the agent
// with macOS text-to-speech, and checks that tool calls change the cooking state.
// Usage: npx tsx scripts/e2e-voice.ts [baseUrl] [utterance...]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const UTTERANCES = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ["What's next?", "How much garlic do I need?", "Repeat that.", "Go back one step.", "What do I do now?", "Set a timer for ten seconds.", "Okay, next step."];

type Frame = Record<string, unknown> & { type?: string };

const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 23), ...a);

function synth(text: string): Buffer {
  const file = path.join(os.tmpdir(), `sous-${Date.now()}.wav`);
  execFileSync("say", ["-v", "Samantha", "-o", file, "--data-format=LEI16@16000", "--file-format=WAVE", text]);
  const wav = fs.readFileSync(file);
  fs.unlinkSync(file);
  // Find the data chunk.
  let off = 12;
  while (off + 8 <= wav.length) {
    const id = wav.toString("ascii", off, off + 4);
    const size = wav.readUInt32LE(off + 4);
    if (id === "data") return wav.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size % 2);
  }
  throw new Error("no data chunk in wav");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const start = await fetch(`${BASE}/api/call/start`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const cfg = (await start.json()) as {
    sessionId: string; secret: string; wsUrl: string; subprotocol: string; startCall: Record<string, unknown>; warnings: string[]; error?: string;
  };
  if (!start.ok) throw new Error(`call start failed: ${JSON.stringify(cfg)}`);
  log("session", cfg.sessionId, "tools:", Array.isArray(cfg.startCall.customTools) ? (cfg.startCall.customTools as unknown[]).length : 0, "warnings:", cfg.warnings);

  const state = async () => (await (await fetch(`${BASE}/api/session/${cfg.sessionId}`)).json()) as { stepIndex: number; timers: { label: string; status: string }[]; substitutions: unknown[]; toolCalls: number };

  const ws = new WebSocket(cfg.wsUrl, [cfg.subprotocol]);
  ws.binaryType = "arraybuffer";

  let audioBytes = 0;
  let playEnd = 0; // simulated playback end, epoch ms
  let agentTurnDone: (() => void) | null = null;
  const transcript: string[] = [];
  const silence = new ArrayBuffer(640);
  let micQueue: Buffer | null = null;
  let micOffset = 0;
  let started = false;

  // Mic pump: 20 ms frames forever, speech when queued, otherwise silence.
  const pump = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN || !started) return;
    if (micQueue && micOffset < micQueue.length) {
      const chunk = micQueue.subarray(micOffset, micOffset + 640);
      micOffset += 640;
      const buf = new Uint8Array(640);
      buf.set(chunk);
      ws.send(buf.buffer);
      if (micOffset >= micQueue.length) micQueue = null;
    } else {
      ws.send(silence);
    }
  }, 20);

  ws.onopen = () => {
    log("ws open, sending start_call");
    ws.send(JSON.stringify(cfg.startCall));
  };
  ws.onclose = (e) => {
    log("ws closed", e.code, e.reason);
    clearInterval(pump);
  };
  ws.onerror = () => log("ws error");
  ws.onmessage = (ev) => {
    if (typeof ev.data !== "string") return;
    const f = JSON.parse(ev.data) as Frame;
    switch (f.type) {
      case "call_started":
        started = true;
        log("call_started", f.call_id);
        break;
      case "audio": {
        const bytes = Math.floor((String(f.data).length * 3) / 4);
        audioBytes += bytes;
        const ms = (bytes / 2 / (Number(f.sample_rate) || 24000)) * 1000;
        const now = Date.now();
        playEnd = Math.max(playEnd, now + 180) + ms;
        break;
      }
      case "mark": {
        const delay = Math.max(0, playEnd - Date.now());
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(f));
          log(`mark echoed (${(audioBytes / 48000).toFixed(1)}s of audio so far)`);
          agentTurnDone?.();
        }, delay);
        break;
      }
      case "clear_audio":
        playEnd = 0;
        log("clear_audio (barge-in)");
        break;
      case "transcript":
      case "conversation_message": {
        const { type, ...rest } = f;
        const line = `${type} ${JSON.stringify(rest)}`;
        transcript.push(line);
        log("  »", line.slice(0, 220));
        break;
      }
      case "event_status":
        log("event_status", JSON.stringify(f));
        break;
      case "error":
        log("ERROR frame", JSON.stringify(f));
        break;
      case "call_ended":
        log("call_ended", JSON.stringify(f));
        break;
      case "pong":
        break;
      default:
        log("frame", JSON.stringify(f).slice(0, 300));
    }
  };

  const waitTurn = (ms = 25000) =>
    new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        agentTurnDone = null;
        log("  (no mark within timeout)");
        resolve();
      }, ms);
      agentTurnDone = () => {
        clearTimeout(t);
        agentTurnDone = null;
        resolve();
      };
    });

  log("waiting for greeting…");
  await waitTurn(30000);
  log("state after greeting:", JSON.stringify(await state()));

  for (const text of UTTERANCES) {
    await sleep(800);
    log(`SAY: "${text}"`);
    micQueue = synth(text);
    micOffset = 0;
    await waitTurn(30000);
    await sleep(1500);
    const s = await state();
    log("state:", `step ${s.stepIndex + 1}`, "toolCalls", s.toolCalls, "timers", JSON.stringify(s.timers.map((t) => `${t.label}:${t.status}`)), "subs", s.substitutions.length);
    if (/timer/i.test(text)) {
      const running = s.timers.find((t) => t.status === "running") as { id?: string; endsAt?: number; label: string } | undefined;
      if (running?.endsAt) {
        const wait = Math.max(0, running.endsAt - Date.now()) + 300;
        log(`waiting ${Math.round(wait / 1000)}s for the timer to end, then sending timer.done event`);
        await sleep(wait);
        ws.send(JSON.stringify({ type: "call_event", name: "timer.done", payload: { timer: running.label }, hint: `Tell the cook their ${running.label} timer is done and what to do next on the current step.`, speak: true, priority: "interrupt", idempotencyKey: `timer-${running.id}` }));
        await waitTurn(30000);
      }
    }
  }

  log("ending call");
  ws.send(JSON.stringify({ type: "end_call" }));
  await sleep(1500);
  ws.close();
  clearInterval(pump);
  console.log("\n=== transcript frames ===");
  for (const l of transcript) console.log(l);
  console.log("\nfinal state:", JSON.stringify(await state(), null, 0));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
