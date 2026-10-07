"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Recipe } from "@/lib/recipe";
import type { SessionState } from "@/lib/session";

export type VoiceStatus = "idle" | "connecting" | "listening" | "speaking" | "sleeping" | "ended" | "error";
export type Line = { id: number; role: "cook" | "sous"; text: string; at: number };

type StartResponse = {
  sessionId: string;
  secret: string;
  wsUrl: string;
  subprotocol: string;
  startCall: Record<string, unknown>;
  state: SessionState;
  recipe: Recipe;
  warnings: string[];
  error?: string;
};

type Frame = Record<string, unknown> & { type?: string };

const POLL_MS = 1000;
const PING_MS = 15000;

/** Pull text and speaker out of a transcript-like frame, whatever its exact shape. */
function parseUtterance(f: Frame): { role: "cook" | "sous"; text: string; final: boolean } | null {
  const text = [f.text, f.transcript, f.content, f.message, f.line].find((v) => typeof v === "string" && v.trim()) as string | undefined;
  if (!text) return null;
  const who = String(f.role ?? f.speaker ?? f.from ?? f.source ?? f.participant ?? "").toLowerCase();
  const role: "cook" | "sous" = /user|caller|human|you|customer/.test(who) ? "cook" : /agent|assistant|ai|bot|model/.test(who) ? "sous" : f.type === "transcript" ? "cook" : "sous";
  const finalRaw = f.final ?? f.is_final ?? f.isFinal ?? f.completed;
  return { role, text: text.trim(), final: finalRaw === undefined ? true : Boolean(finalRaw) };
}

export function useVoiceCall() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [state, setState] = useState<SessionState | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [callId, setCallId] = useState<string | null>(null);

  const r = useRef({
    ws: null as WebSocket | null,
    captureCtx: null as AudioContext | null,
    playCtx: null as AudioContext | null,
    stream: null as MediaStream | null,
    muted: false,
    base: "listening" as "listening" | "sleeping",
    playing: new Set<AudioBufferSourceNode>(),
    heldMarks: [] as Frame[],
    playhead: 0,
    sessionId: "",
    secret: "",
    silence: new ArrayBuffer(640),
    pingTimer: 0 as ReturnType<typeof setInterval> | 0,
    pollTimer: 0 as ReturnType<typeof setInterval> | 0,
    fired: new Set<string>(),
    lastSleepAt: 0,
    lineId: 0,
    partialId: null as number | null,
    closed: false,
  });

  const addLine = useCallback((role: "cook" | "sous", text: string, final: boolean) => {
    setLines((prev) => {
      const ref = r.current;
      // Revise a partial of the same role in place; otherwise append.
      if (ref.partialId !== null) {
        const idx = prev.findIndex((l) => l.id === ref.partialId);
        if (idx >= 0 && prev[idx].role === role) {
          const next = [...prev];
          next[idx] = { ...next[idx], text, at: Date.now() };
          if (final) ref.partialId = null;
          return next;
        }
      }
      const id = ++ref.lineId;
      ref.partialId = final ? null : id;
      return [...prev.slice(-30), { id, role, text, at: Date.now() }];
    });
  }, []);

  const send = useCallback((obj: Record<string, unknown>) => {
    const ws = r.current.ws;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }, []);

  const sendHeldMarks = useCallback(() => {
    const ref = r.current;
    while (ref.heldMarks.length) send(ref.heldMarks.shift()!);
  }, [send]);

  const setBase = useCallback((base: "listening" | "sleeping") => {
    const ref = r.current;
    ref.base = base;
    ref.muted = base === "sleeping";
    if (ref.playing.size === 0) setStatus(base);
  }, []);

  const play = useCallback(
    (frame: Frame) => {
      const ref = r.current;
      const ctx = ref.playCtx;
      if (!ctx || typeof frame.data !== "string") return;
      const bytes = Uint8Array.from(atob(frame.data), (c) => c.charCodeAt(0));
      const pcm = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
      if (!pcm.length) return;
      const rate = Number(frame.sample_rate) || 24000;
      const buf = ctx.createBuffer(1, pcm.length, rate);
      buf.getChannelData(0).set(Float32Array.from(pcm, (s) => s / 32768));
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      if (ref.playhead <= ctx.currentTime) ref.playhead = ctx.currentTime + 0.18;
      src.start(ref.playhead);
      ref.playhead += buf.duration;
      ref.playing.add(src);
      setStatus("speaking");
      src.onended = () => {
        ref.playing.delete(src);
        if (ref.playing.size === 0) {
          sendHeldMarks();
          setStatus(ref.base);
        }
      };
    },
    [sendHeldMarks]
  );

  const stopPlayback = useCallback(() => {
    const ref = r.current;
    for (const s of ref.playing) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    ref.playing.clear();
    ref.playhead = 0;
    sendHeldMarks();
    setStatus(ref.base);
  }, [sendHeldMarks]);

  const refresh = useCallback(async () => {
    const ref = r.current;
    if (!ref.sessionId) return;
    try {
      const res = await fetch(`/api/session/${ref.sessionId}`, { cache: "no-store" });
      if (!res.ok) return;
      const s = (await res.json()) as SessionState;
      setState(s);
      if (s.voiceCommand && s.voiceCommand.at > ref.lastSleepAt) {
        ref.lastSleepAt = s.voiceCommand.at;
        setBase("sleeping");
      }
    } catch {
      /* transient */
    }
  }, [setBase]);

  /** Apply a tool from the screen (manual controls, timer firing). */
  const act = useCallback(
    async (tool: string, args: Record<string, unknown> = {}, opts: { notifyAgent?: boolean } = {}) => {
      const ref = r.current;
      if (!ref.sessionId) return null;
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Sous-Session": ref.sessionId, "X-Sous-Secret": ref.secret },
        body: JSON.stringify({ tool, arguments: args, call: { id: callId ?? undefined } }),
      });
      const result = (await res.json().catch(() => ({}))) as { spoken?: string; stepNumber?: number; title?: string };
      await refresh();
      if (opts.notifyAgent && result.stepNumber) {
        send({
          type: "call_event",
          name: "step.changed",
          payload: { step: `step ${result.stepNumber}`, title: result.title ?? "" },
          hint: "The cook changed steps on the screen. Remember the new step. Say nothing unless asked.",
          speak: false,
          priority: "normal",
        });
      }
      return result;
    },
    [callId, refresh, send]
  );

  const cleanup = useCallback(() => {
    const ref = r.current;
    ref.closed = true;
    if (ref.pingTimer) clearInterval(ref.pingTimer);
    if (ref.pollTimer) clearInterval(ref.pollTimer);
    ref.pingTimer = 0;
    ref.pollTimer = 0;
    ref.stream?.getTracks().forEach((t) => t.stop());
    ref.stream = null;
    ref.captureCtx?.close().catch(() => {});
    ref.playCtx?.close().catch(() => {});
    ref.captureCtx = null;
    ref.playCtx = null;
    for (const s of ref.playing) {
      try {
        s.stop();
      } catch {
        /* noop */
      }
    }
    ref.playing.clear();
    ref.ws = null;
  }, []);

  const stop = useCallback(() => {
    const ref = r.current;
    send({ type: "end_call" });
    try {
      ref.ws?.close();
    } catch {
      /* noop */
    }
    cleanup();
    setStatus("ended");
  }, [cleanup, send]);

  const handleFrame = useCallback(
    (f: Frame) => {
      const ref = r.current;
      switch (f.type) {
        case "call_started":
          setCallId(String(f.call_id ?? ""));
          setStatus(ref.base);
          break;
        case "audio":
          play(f);
          break;
        case "mark":
          ref.heldMarks.push(f);
          if (ref.playing.size === 0) sendHeldMarks();
          break;
        case "clear_audio":
          stopPlayback();
          break;
        case "transcript":
        case "conversation_message": {
          const u = parseUtterance(f);
          if (u) addLine(u.role, u.text, u.final);
          if (u?.role === "sous" && u.final) void refresh();
          break;
        }
        case "event_status":
          if (process.env.NODE_ENV !== "production") console.debug("[alebex] event_status", f);
          break;
        case "pong":
          break;
        case "call_ended":
          cleanup();
          setStatus("ended");
          break;
        case "error": {
          const msg = `${f.code ?? "error"}: ${f.message ?? ""}`;
          console.error("[alebex]", msg);
          setError(msg);
          break;
        }
        default:
          if (process.env.NODE_ENV !== "production") console.debug("[alebex] frame", f);
      }
    },
    [addLine, cleanup, play, refresh, sendHeldMarks, stopPlayback]
  );

  const start = useCallback(
    async (recipeId?: string) => {
      const ref = r.current;
      setError(null);
      setLines([]);
      setStatus("connecting");
      try {
        // 1. Ask the server for a session, a socket token and the start_call frame.
        const res = await fetch("/api/call/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        });
        const cfg = (await res.json()) as StartResponse;
        if (!res.ok || cfg.error) throw new Error(cfg.error ?? `start failed (${res.status})`);
        ref.sessionId = cfg.sessionId;
        ref.secret = cfg.secret;
        ref.closed = false;
        ref.base = "listening";
        ref.muted = false;
        ref.fired.clear();
        ref.lastSleepAt = 0;
        setState(cfg.state);
        setRecipe(cfg.recipe);
        setWarnings(cfg.warnings ?? []);

        // 2. Microphone and audio contexts (inside the click, so autoplay rules are satisfied).
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        ref.stream = stream;
        const playCtx = new AudioContext({ sampleRate: 24000 });
        ref.playCtx = playCtx;
        let captureCtx: AudioContext;
        try {
          captureCtx = new AudioContext({ sampleRate: 16000 });
        } catch {
          captureCtx = new AudioContext();
        }
        ref.captureCtx = captureCtx;
        await captureCtx.audioWorklet.addModule("/pcm-worklet.js");
        const source = captureCtx.createMediaStreamSource(stream);
        const node = new AudioWorkletNode(captureCtx, "pcm-worklet");
        const sink = captureCtx.createGain();
        sink.gain.value = 0;
        source.connect(node);
        node.connect(sink);
        sink.connect(captureCtx.destination);
        node.port.onmessage = (ev: MessageEvent<ArrayBuffer>) => {
          const ws = ref.ws;
          if (ws && ws.readyState === WebSocket.OPEN) ws.send(ref.muted ? ref.silence : ev.data);
        };
        await playCtx.resume();
        await captureCtx.resume();

        // 3. Open the call.
        const ws = new WebSocket(cfg.wsUrl, [cfg.subprotocol]);
        ws.binaryType = "arraybuffer";
        ref.ws = ws;
        ws.onopen = () => {
          ws.send(JSON.stringify(cfg.startCall));
          ref.pingTimer = setInterval(() => send({ type: "ping" }), PING_MS);
          ref.pollTimer = setInterval(() => void refresh(), POLL_MS);
        };
        ws.onmessage = (ev) => {
          if (typeof ev.data !== "string") return;
          try {
            handleFrame(JSON.parse(ev.data) as Frame);
          } catch {
            /* ignore malformed */
          }
        };
        ws.onerror = () => setError("The voice connection hit an error.");
        ws.onclose = (ev) => {
          if (ref.closed) return;
          cleanup();
          setStatus((s) => (s === "ended" ? s : "ended"));
          if (ev.code !== 1000 && ev.code !== 1005) setError((e) => e ?? `Connection closed (${ev.code})`);
        };
      } catch (e) {
        cleanup();
        setError((e as Error).message);
        setStatus("error");
      }
    },
    [cleanup, handleFrame, refresh, send]
  );

  const toggleSleep = useCallback(() => {
    const ref = r.current;
    if (status === "idle" || status === "ended" || status === "error") return;
    setBase(ref.base === "sleeping" ? "listening" : "sleeping");
  }, [setBase, status]);

  // Fire timers from the browser clock: chime, tell the agent, mark it fired.
  useEffect(() => {
    if (!state) return;
    const ref = r.current;
    const now = Date.now();
    for (const t of state.timers) {
      if (t.status !== "running" || t.endsAt > now || ref.fired.has(t.id)) continue;
      ref.fired.add(t.id);
      chime(ref.playCtx);
      send({
        type: "call_event",
        name: "timer.done",
        payload: { timer: t.label },
        hint: `Tell the cook their ${t.label} timer is done and what to do next on the current step.`,
        speak: true,
        priority: "interrupt",
        idempotencyKey: `timer-${t.id}`,
      });
      void act("manage_timer", { action: "fired", timer_id: t.id });
    }
  }, [state, send, act]);

  useEffect(() => () => cleanup(), [cleanup]);

  return { status, error, lines, state, recipe, warnings, callId, start, stop, toggleSleep, act, refresh };
}

function chime(ctx: AudioContext | null) {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  [880, 1174.66, 1318.51].forEach((freq, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0 + i * 0.18);
    g.gain.linearRampToValueAtTime(0.25, t0 + i * 0.18 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.18 + 0.5);
    o.connect(g).connect(ctx.destination);
    o.start(t0 + i * 0.18);
    o.stop(t0 + i * 0.18 + 0.55);
  });
}
